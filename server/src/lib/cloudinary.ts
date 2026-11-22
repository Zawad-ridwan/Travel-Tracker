import { createHash } from 'node:crypto';
import { env } from '../config/env';
import { HttpError } from '../middleware/errors';

/**
 * Minimal Cloudinary client using its REST API (no SDK needed).
 * Free plan: enough storage and bandwidth for profile photos.
 */

const AVATAR_FOLDER = 'travel-tracker/avatars';

/** Cloudinary signs a request with SHA-1 of the sorted parameters plus the API secret. */
function sign(params: Record<string, string>) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1')
    .update(toSign + env.CLOUDINARY_API_SECRET)
    .digest('hex');
}

function endpoint(action: 'upload' | 'destroy') {
  return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/${action}`;
}

/** Turns the stored URL into a 256×256 face-centred, auto-format version. */
function avatarUrl(secureUrl: string) {
  return secureUrl.replace('/upload/', '/upload/c_fill,g_face,w_256,h_256,f_auto,q_auto/');
}

/** Checks the file really is an image by its first bytes, not by what the browser claims. */
export function detectImageType(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  return null;
}

export async function uploadAvatar(userId: string, buffer: Buffer, mimeType: string) {
  if (!env.uploadsEnabled) {
    throw new HttpError(503, 'Photo uploads are not set up on this server yet', 'UPLOADS_DISABLED');
  }

  const params = {
    folder: AVATAR_FOLDER,
    public_id: `user_${userId}`,
    overwrite: 'true',
    invalidate: 'true',
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), 'avatar');
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', env.CLOUDINARY_API_KEY!);
  form.append('signature', sign(params));

  const res = await fetch(endpoint('upload'), {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message: string } };

  if (!res.ok || !data.secure_url || !data.public_id) {
    console.error('Cloudinary upload failed:', data.error?.message ?? res.status);
    throw new HttpError(502, 'The photo could not be uploaded. Please try again.', 'UPLOAD_FAILED');
  }

  return { url: avatarUrl(data.secure_url), publicId: data.public_id };
}

/** Deletes a photo. Failures are logged, not thrown: a leftover file is harmless. */
export async function deleteImage(publicId: string) {
  if (!env.uploadsEnabled) return;
  const params = { public_id: publicId, invalidate: 'true', timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', env.CLOUDINARY_API_KEY!);
  form.append('signature', sign(params));
  try {
    await fetch(endpoint('destroy'), { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}
