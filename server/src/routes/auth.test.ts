import { describe, expect, it } from 'vitest';
import { Session } from '../models/Session';
import { User } from '../models/User';
import {
  CLIENT_HEADER,
  lastEmailToken,
  newAgent,
  signUp,
  testOutbox,
  VALID_USER,
} from '../test/helpers';

const H = CLIENT_HEADER;

describe('POST /api/auth/signup', () => {
  it('creates an account, logs in and sends a verification email', async () => {
    const { agent, res } = await signUp();

    expect(res.body.user).toMatchObject({
      name: VALID_USER.name,
      email: VALID_USER.email,
      role: 'user',
      emailVerified: false,
      level: 1,
    });
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('tt_at=') && c.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('tt_rt=') && c.includes('Path=/api/auth'))).toBe(true);

    expect(testOutbox).toHaveLength(1);
    expect(testOutbox[0]!.to.email).toBe(VALID_USER.email);

    await agent.get('/api/auth/me').expect(200);
  });

  it('stores a hash, never the password', async () => {
    await signUp();
    const user = await User.findOne({ email: VALID_USER.email }).select('+passwordHash');
    expect(user!.passwordHash).not.toBe(VALID_USER.password);
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('normalises the email', async () => {
    const { res } = await signUp(newAgent(), { ...VALID_USER, email: '  Ayesha@Example.COM ' });
    expect(res.body.user.email).toBe('ayesha@example.com');
  });

  it('rejects a duplicate email', async () => {
    await signUp();
    const res = await newAgent().post('/api/auth/signup').set(H, 't').send(VALID_USER);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('explains invalid fields', async () => {
    const res = await newAgent()
      .post('/api/auth/signup')
      .set(H, 't')
      .send({ name: 'A', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('blocks requests without the client header (CSRF protection)', async () => {
    const res = await newAgent().post('/api/auth/signup').send(VALID_USER);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    await signUp();
    const agent = newAgent();
    const res = await agent
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: VALID_USER.email, password: VALID_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(VALID_USER.email);
    await agent.get('/api/auth/me').expect(200);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await signUp();
    const wrong = await newAgent()
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: VALID_USER.email, password: 'wrong-pass1' });
    const unknown = await newAgent()
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: 'nobody@example.com', password: 'wrong-pass1' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when logged out', async () => {
    const res = await newAgent().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns TOKEN_EXPIRED for a bad access token, so the client knows to refresh', async () => {
    const res = await newAgent().get('/api/auth/me').set('Cookie', 'tt_at=forged.token.value');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues a new access token from the refresh cookie', async () => {
    const { agent } = await signUp();
    const res = await agent.post('/api/auth/refresh').set(H, 't');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(VALID_USER.email);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('tt_at='))).toBe(true);
  });

  it('fails without a refresh cookie', async () => {
    const res = await newAgent().post('/api/auth/refresh').set(H, 't');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('ends the session so refresh no longer works', async () => {
    const { agent } = await signUp();
    expect(await Session.countDocuments()).toBe(1);

    await agent.post('/api/auth/logout').set(H, 't').expect(200);

    expect(await Session.countDocuments()).toBe(0);
    await agent.post('/api/auth/refresh').set(H, 't').expect(401);
  });
});

describe('email verification', () => {
  it('confirms the email with the emailed link and awards XP', async () => {
    const { agent } = await signUp();
    const token = lastEmailToken();

    await newAgent().post('/api/auth/verify-email').set(H, 't').send({ token }).expect(200);

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.emailVerified).toBe(true);
    expect(me.body.user.xp).toBe(25);
  });

  it('works only once', async () => {
    await signUp();
    const token = lastEmailToken();
    await newAgent().post('/api/auth/verify-email').set(H, 't').send({ token }).expect(200);
    const again = await newAgent().post('/api/auth/verify-email').set(H, 't').send({ token });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('INVALID_TOKEN');
  });

  it('can resend the link, and only the newest link works', async () => {
    const { agent } = await signUp();
    const oldToken = lastEmailToken();
    await agent.post('/api/auth/resend-verification').set(H, 't').expect(200);
    const newToken = lastEmailToken();

    expect(newToken).not.toBe(oldToken);
    await newAgent().post('/api/auth/verify-email').set(H, 't').send({ token: oldToken }).expect(400);
    await newAgent().post('/api/auth/verify-email').set(H, 't').send({ token: newToken }).expect(200);
  });
});

describe('password reset', () => {
  it('answers the same whether or not the account exists', async () => {
    await signUp();
    testOutbox.length = 0;

    const known = await newAgent()
      .post('/api/auth/forgot-password')
      .set(H, 't')
      .send({ email: VALID_USER.email });
    const unknown = await newAgent()
      .post('/api/auth/forgot-password')
      .set(H, 't')
      .send({ email: 'nobody@example.com' });

    expect(known.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    expect(testOutbox).toHaveLength(1); // only the real account gets an email
  });

  it('sets a new password and logs out every device', async () => {
    const { agent } = await signUp();
    await newAgent().post('/api/auth/forgot-password').set(H, 't').send({ email: VALID_USER.email });
    const token = lastEmailToken();

    await newAgent()
      .post('/api/auth/reset-password')
      .set(H, 't')
      .send({ token, password: 'brandnew99' })
      .expect(200);

    expect(await Session.countDocuments()).toBe(0);
    await agent.post('/api/auth/refresh').set(H, 't').expect(401);

    await newAgent()
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: VALID_USER.email, password: VALID_USER.password })
      .expect(401);
    await newAgent()
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: VALID_USER.email, password: 'brandnew99' })
      .expect(200);
  });

  it('rejects an invalid link', async () => {
    const res = await newAgent()
      .post('/api/auth/reset-password')
      .set(H, 't')
      .send({ token: 'a'.repeat(64), password: 'brandnew99' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});
