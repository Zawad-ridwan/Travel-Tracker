import { describe, expect, it } from 'vitest';
import { newAgent, signUp, signUpAdmin } from '../test/helpers';

describe('admin routes', () => {
  it('are closed to visitors', async () => {
    const res = await newAgent().get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('are closed to normal users', async () => {
    const { agent } = await signUp();
    const res = await agent.get('/api/admin/stats');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('give admins the stats', async () => {
    await signUp();
    const admin = await signUpAdmin();
    const res = await admin.get('/api/admin/stats');

    expect(res.status).toBe(200);
    expect(res.body.users).toMatchObject({ total: 2, admins: 1, newLast7Days: 2 });
    expect(res.body.signupsByDay).toHaveLength(14);
    expect(res.body.signupsByDay.at(-1).count).toBe(2);
  });

  it('list and search users', async () => {
    await signUp();
    const admin = await signUpAdmin();

    const all = await admin.get('/api/admin/users').expect(200);
    expect(all.body.total).toBe(2);
    expect(all.body.items[0].passwordHash).toBeUndefined();

    const found = await admin.get('/api/admin/users?search=ayesha').expect(200);
    expect(found.body.items).toHaveLength(1);
    expect(found.body.items[0].email).toBe('ayesha@example.com');
  });

  it('treat search text literally (no regex tricks)', async () => {
    const admin = await signUpAdmin();
    const res = await admin.get('/api/admin/users?search=.*').expect(200);
    expect(res.body.total).toBe(0);
  });
});
