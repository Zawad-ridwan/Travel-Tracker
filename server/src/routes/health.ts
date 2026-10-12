import { Router } from 'express';
import type { HealthResponse } from '@tt/shared';

export const healthRouter = Router();

/** GET /api/health — lets the client (and uptime monitors) check the API is running. */
healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'travel-tracker-api',
    version: process.env.npm_package_version ?? '0.1.0',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
