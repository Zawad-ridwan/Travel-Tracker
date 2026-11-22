import { model, Schema, type Types } from 'mongoose';

export const TOKEN_TYPES = ['verify_email', 'reset_password'] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

/**
 * One-time tokens sent by email (verify address, reset password).
 * Only the hash is stored. Expired tokens are deleted automatically.
 */
export interface IToken {
  userId: Types.ObjectId;
  type: TokenType;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TOKEN_TYPES, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Token = model<IToken>('Token', tokenSchema);
