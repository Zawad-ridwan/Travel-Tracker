import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { API_PREFIX } from '@tt/shared';
import { env } from './config/env';
import { authenticate } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errors';
import { apiLimiter, requireClientHeader } from './middleware/security';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { currencyRouter } from './routes/currency';
import { healthRouter } from './routes/health';
import { tripsRouter } from './routes/trips';
import { usersRouter } from './routes/users';

/** Where `npm run build` puts the React app (travel-tracker/client/dist). */
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

/** Builds the Express app. Kept separate from `listen()` so tests can use it directly. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // On Render (and most hosts) requests pass through one proxy; trust it for the real visitor IP
  if (env.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // Motion and toasts set inline styles for animations
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: env.isProduction ? [] : null,
        },
      },
    }),
  );
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // API
  const api = express.Router();
  api.use(apiLimiter, requireClientHeader, authenticate);
  api.use('/health', healthRouter);
  api.use('/auth', authRouter);
  api.use('/users', usersRouter);
  api.use('/admin', adminRouter);
  api.use('/trips', tripsRouter);
  api.use('/currency', currencyRouter);
  api.use(notFound);
  app.use(API_PREFIX, api);

  // In production the same server also delivers the React app (one service, one address)
  if (env.SERVE_CLIENT) {
    app.use(
      '/assets',
      express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }),
    );
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    // Any other page address loads index.html; React Router takes it from there
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
