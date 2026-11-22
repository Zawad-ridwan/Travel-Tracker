import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './db/connect';

async function main() {
  await connectDatabase(env.MONGODB_URI);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    if (!env.emailEnabled) console.log('Email: not configured, links are printed here instead');
    if (!env.uploadsEnabled) console.log('Photo uploads: not configured (optional)');
  });

  // Close cleanly when the process is stopped (Ctrl+C or the host shutting down)
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    });
  }
}

main().catch(() => process.exit(1));
