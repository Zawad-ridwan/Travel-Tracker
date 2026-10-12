import type { ApiErrorResponse, HealthResponse } from '@tt/shared';
import { API_PREFIX } from '@tt/shared';

/** Empty in development (Vite forwards /api to the server); the API address in production. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Small wrapper around fetch: JSON in, JSON out, cookies included, errors thrown as ApiError. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(res.status, body?.error.message ?? res.statusText, body?.error.code);
  }

  return (await res.json()) as T;
}

export const api = {
  health: () => apiFetch<HealthResponse>('/health'),
};
