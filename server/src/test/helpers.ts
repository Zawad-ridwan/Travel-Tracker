import request from 'supertest';
import { CLIENT_HEADER } from '@tt/shared';
import { createApp } from '../app';
import { testOutbox } from '../lib/email';
import { User } from '../models/User';

export const app = createApp();

/** A browser-like client: keeps cookies between requests. */
export function newAgent() {
  return request.agent(app);
}

export const VALID_USER = {
  name: 'Ayesha Rahman',
  email: 'ayesha@example.com',
  password: 'travel123',
};

/** Signs up (and so logs in) a user on the given agent. */
export async function signUp(agent = newAgent(), user = VALID_USER) {
  const res = await agent.post('/api/auth/signup').set(CLIENT_HEADER, 'test').send(user);
  if (res.status !== 201) throw new Error(`Sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, res };
}

/** Signs up a user and promotes them to admin, then logs in again so the token has the new role. */
export async function signUpAdmin() {
  const admin = { name: 'Admin Person', email: 'admin@example.com', password: 'admin1234' };
  const { agent } = await signUp(newAgent(), admin);
  await User.updateOne({ email: admin.email }, { role: 'admin' });
  await agent.post('/api/auth/login').set(CLIENT_HEADER, 'test').send(admin).expect(200);
  return agent;
}

/** Pulls the token out of the last email's link. */
export function lastEmailToken() {
  const email = testOutbox.at(-1);
  const match = email?.text.match(/token=([a-f0-9]+)/);
  if (!match?.[1]) throw new Error('No token found in the last email');
  return match[1];
}

export { CLIENT_HEADER, testOutbox };
