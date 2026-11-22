import { model, Schema, type Types } from 'mongoose';

/**
 * One row per logged-in device. The browser holds a random refresh token;
 * we store only its SHA-256 hash, so a database leak cannot be used to log in.
 * MongoDB deletes rows automatically once expiresAt has passed (TTL index).
 */
export interface ISession {
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ip: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>('Session', sessionSchema);
