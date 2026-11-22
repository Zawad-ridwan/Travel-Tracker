import type { UserRole } from '@tt/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware when a valid access token is present. */
      auth?: {
        userId: string;
        role: UserRole;
        sessionId: string;
      };
    }
  }
}

export {};
