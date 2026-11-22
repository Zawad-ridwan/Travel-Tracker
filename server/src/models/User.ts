import { model, Schema, type HydratedDocument } from 'mongoose';
import { TRAVEL_STYLE_IDS, USER_ROLES, type TravelStyle, type UserRole } from '@tt/shared';

export interface IUser {
  name: string;
  email: string;
  /** bcrypt hash. Never sent to the client; not loaded unless asked for with .select('+passwordHash'). */
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  bio: string;
  homeCountry: string | null;
  travelStyles: TravelStyle[];
  dreamDestination: string;
  profileVisibility: 'public' | 'private';
  onboardingCompleted: boolean;
  xp: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null, select: false },
    bio: { type: String, default: '', maxlength: 280 },
    homeCountry: { type: String, default: null },
    travelStyles: { type: [{ type: String, enum: TRAVEL_STYLE_IDS }], default: [] },
    dreamDestination: { type: String, default: '', maxlength: 80 },
    profileVisibility: { type: String, enum: ['public', 'private'], default: 'private' },
    onboardingCompleted: { type: Boolean, default: false },
    xp: { type: Number, default: 0, min: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

export const User = model<IUser>('User', userSchema);
