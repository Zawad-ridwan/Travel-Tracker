import { describe, expect, it } from 'vitest';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { CLIENT_HEADER, newAgent, signUp, VALID_USER } from '../test/helpers';

const H = CLIENT_HEADER;

describe('PATCH /api/users/me', () => {
  it('updates profile fields', async () => {
    const { agent } = await signUp();
    const res = await agent
      .patch('/api/users/me')
      .set(H, 't')
      .send({ bio: 'Chasing sunsets', homeCountry: 'BD', profileVisibility: 'public' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      bio: 'Chasing sunsets',
      homeCountry: 'BD',
      profileVisibility: 'public',
    });
  });

  it('refuses fields that cannot be changed this way', async () => {
    const { agent } = await signUp();
    const res = await agent.patch('/api/users/me').set(H, 't').send({ role: 'admin' });
    expect(res.status).toBe(400);
    const user = await User.findOne({ email: VALID_USER.email });
    expect(user!.role).toBe('user');
  });

  it('rejects an unknown country code', async () => {
    const { agent } = await signUp();
    const res = await agent.patch('/api/users/me').set(H, 't').send({ homeCountry: 'XX' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.homeCountry).toBeDefined();
  });

  it('requires login', async () => {
    const res = await newAgent().patch('/api/users/me').set(H, 't').send({ bio: 'hi' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/me/onboarding', () => {
  it('saves the answers and awards XP once', async () => {
    const { agent } = await signUp();
    const answers = { travelStyles: ['food', 'culture'], homeCountry: 'BD', dreamDestination: 'Kyoto' };

    const first = await agent.post('/api/users/me/onboarding').set(H, 't').send(answers);
    expect(first.status).toBe(200);
    expect(first.body.user).toMatchObject({ onboardingCompleted: true, xp: 25, ...answers });

    const second = await agent.post('/api/users/me/onboarding').set(H, 't').send(answers);
    expect(second.body.user.xp).toBe(25);
  });

  it('needs at least one travel style', async () => {
    const { agent } = await signUp();
    const res = await agent
      .post('/api/users/me/onboarding')
      .set(H, 't')
      .send({ travelStyles: [], homeCountry: 'BD', dreamDestination: '' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/users/me/avatar', () => {
  it('rejects files that are not images, whatever their name says', async () => {
    const { agent } = await signUp();
    const res = await agent
      .post('/api/users/me/avatar')
      .set(H, 't')
      .attach('avatar', Buffer.from('not really a picture at all'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_FILE_TYPE');
  });

  it('explains when uploads are not set up', async () => {
    const { agent } = await signUp();
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(32),
    ]);
    const res = await agent
      .post('/api/users/me/avatar')
      .set(H, 't')
      .attach('avatar', png, { filename: 'me.png', contentType: 'image/png' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('UPLOADS_DISABLED');
  });
});

describe('POST /api/users/me/password', () => {
  it('changes the password and logs out other devices only', async () => {
    const { agent } = await signUp();
    const otherDevice = newAgent();
    await otherDevice
      .post('/api/auth/login')
      .set(H, 't')
      .send({ email: VALID_USER.email, password: VALID_USER.password })
      .expect(200);
    expect(await Session.countDocuments()).toBe(2);

    await agent
      .post('/api/users/me/password')
      .set(H, 't')
      .send({ currentPassword: VALID_USER.password, newPassword: 'newpass123' })
      .expect(200);

    expect(await Session.countDocuments()).toBe(1);
    await agent.post('/api/auth/refresh').set(H, 't').expect(200);
    await otherDevice.post('/api/auth/refresh').set(H, 't').expect(401);
  });

  it('needs the current password', async () => {
    const { agent } = await signUp();
    const res = await agent
      .post('/api/users/me/password')
      .set(H, 't')
      .send({ currentPassword: 'wrong-one1', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.currentPassword).toBeDefined();
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the account after confirming the password', async () => {
    const { agent } = await signUp();
    await agent.delete('/api/users/me').set(H, 't').send({ password: 'wrong-one1' }).expect(400);
    await agent
      .delete('/api/users/me')
      .set(H, 't')
      .send({ password: VALID_USER.password })
      .expect(200);

    expect(await User.countDocuments()).toBe(0);
    expect(await Session.countDocuments()).toBe(0);
  });
});
