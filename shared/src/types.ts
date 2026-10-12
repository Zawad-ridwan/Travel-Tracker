import type { USER_ROLES } from './constants';

export type UserRole = (typeof USER_ROLES)[number];

/** Response of GET /api/health */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

/** Shape of every error the API sends back. */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}
