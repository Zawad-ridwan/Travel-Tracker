import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { setRatesForTests } from '../lib/currency';
import { testOutbox } from '../lib/email';
import { TEST_RATES } from './rates';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Build unique indexes before tests rely on them
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});

beforeEach(() => {
  setRatesForTests(TEST_RATES);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  testOutbox.length = 0;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
