import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Settings for tests only. The real database is replaced by an in-memory one (src/test/setup.ts)
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/replaced-in-setup',
      JWT_ACCESS_SECRET: 'test-only-secret-that-is-long-enough-1234567890',
      APP_URL: 'http://localhost:5173',
    },
    setupFiles: ['./src/test/setup.ts'],
    // The first run downloads a MongoDB binary (~100 MB), which can take a while
    hookTimeout: 180_000,
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
