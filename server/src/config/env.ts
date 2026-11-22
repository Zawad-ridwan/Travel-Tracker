import 'dotenv/config';
import { z } from 'zod';

/**
 * All environment variables the server uses, checked at startup.
 * If one is missing or wrong, the server stops with a clear message
 * instead of failing later in a confusing way.
 */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /** Where the website runs. Used for CORS. Several can be comma-separated. */
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  /** Public address of the website, used in email links. */
  APP_URL: z.url('APP_URL must be a full address, like https://example.com').default('http://localhost:5173'),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is missing. See SETUP.md, step 1.')
    .refine((v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'), {
      error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    }),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters. See SETUP.md, step 2.'),

  /** Email (Brevo). Optional in development: links are printed in the terminal instead. */
  BREVO_API_KEY: optional,
  EMAIL_FROM_ADDRESS: optional,
  EMAIL_FROM_NAME: z.string().default('Travel Tracker'),

  /** Profile photos (Cloudinary). Optional: uploads are switched off without them. */
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,

  /** "true" on the host: the API also serves the built React app (one service, one address). */
  SERVE_CLIENT: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\nThe server cannot start. Fix these settings in server/.env:\n');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('');
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  clientOrigins: data.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
  isProduction: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  emailEnabled: Boolean(data.BREVO_API_KEY && data.EMAIL_FROM_ADDRESS),
  uploadsEnabled: Boolean(
    data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_SECRET,
  ),
};

if (env.isProduction && !env.emailEnabled) {
  console.warn('Warning: email is not configured, so verification and reset emails will not send.');
}
