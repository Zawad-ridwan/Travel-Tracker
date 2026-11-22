import { describe, expect, it } from 'vitest';
import { newAgent } from './test/helpers';

describe('GET /api/health', () => {
  it('reports the API and database are running', async () => {
    const res = await newAgent().get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'travel-tracker-api',
      database: 'connected',
    });
  });

  it('sets security headers', async () => {
    const res = await newAgent().get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await newAgent().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('return a JSON 400 for broken JSON', async () => {
    const res = await newAgent()
      .post('/api/auth/login')
      .set('X-TT-Client', 'test')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_JSON');
  });
});
