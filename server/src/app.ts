import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { API_PREFIX } from '@tt/shared';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { errorHandler, notFound } from './middleware/errors';

/** Builds the Express app. Kept separate from `listen()` so tests can use it directly. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // Routes
  app.use(`${API_PREFIX}/health`, healthRouter);

  // Must be last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
