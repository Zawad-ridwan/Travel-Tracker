import { Router } from 'express';
import type { HealthResponse } from '@tt/shared';
import { isDatabaseConnected } from '../db/connect';

export const healthRouter = Router();

/** GET /api/health — lets the client (and uptime monitors) check the API and database. */
healthRouter.get('/', (_req, res) => {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected';
  const body: HealthResponse = {
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'travel-tracker-api',
    version: process.env.npm_package_version ?? '0.2.0',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.status(database === 'connected' ? 200 : 503).json(body);
});
