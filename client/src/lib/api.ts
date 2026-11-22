import {
  API_PREFIX,
  CLIENT_HEADER,
  type AdminStats,
  type AdminUserRow,
  type ApiErrorResponse,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type ForgotPasswordInput,
  type HealthResponse,
  type LoginInput,
  type MessageResponse,
  type OnboardingInput,
  type Paginated,
  type ResetPasswordInput,
  type SignupInput,
  type UpdateProfileInput,
  type UserResponse,
} from '@tt/shared';

/** Empty in development (Vite forwards /api to the server); the API address if hosted separately. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * When the 15-minute access token runs out, the first failing request refreshes it.
 * Requests that fail at the same moment wait for that same refresh instead of starting their own.
 */
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { [CLIENT_HEADER]: 'web' },
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set to false for requests that must not trigger a refresh (e.g. login). */
  retryOnExpired?: boolean;
}

/** Small wrapper around fetch: JSON in, JSON out, cookies included, errors thrown as ApiError. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, retryOnExpired = true } = options;
  const isForm = body instanceof FormData;

  const send = () =>
    fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      credentials: 'include',
      headers: {
        [CLIENT_HEADER]: 'web',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.', 'NETWORK');
  }

  if (res.status === 401 && retryOnExpired) {
    const err = (await res
      .clone()
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    // The browser drops the access cookie when it expires, so "not logged in" may just mean
    // "access token gone". The refresh cookie (if any) can bring the session back.
    const code = err?.error.code;
    if ((code === 'TOKEN_EXPIRED' || code === 'UNAUTHENTICATED') && (await refreshSession())) {
      res = await send();
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(
      res.status,
      err?.error.message ?? `Request failed (${res.status})`,
      err?.error.code,
      err?.error.fields,
    );
  }

  return (await res.json()) as T;
}

/** Every API call the app makes, in one place. */
export const api = {
  health: () => apiFetch<HealthResponse>('/health'),

  auth: {
    me: () => apiFetch<UserResponse>('/auth/me'),
    signup: (data: SignupInput) =>
      apiFetch<UserResponse>('/auth/signup', { method: 'POST', body: data, retryOnExpired: false }),
    login: (data: LoginInput) =>
      apiFetch<UserResponse>('/auth/login', { method: 'POST', body: data, retryOnExpired: false }),
    logout: () =>
      apiFetch<MessageResponse>('/auth/logout', { method: 'POST', retryOnExpired: false }),
    verifyEmail: (token: string) =>
      apiFetch<MessageResponse>('/auth/verify-email', { method: 'POST', body: { token } }),
    resendVerification: () =>
      apiFetch<MessageResponse>('/auth/resend-verification', { method: 'POST' }),
    forgotPassword: (data: ForgotPasswordInput) =>
      apiFetch<MessageResponse>('/auth/forgot-password', { method: 'POST', body: data }),
    resetPassword: (data: ResetPasswordInput) =>
      apiFetch<MessageResponse>('/auth/reset-password', { method: 'POST', body: data }),
  },

  users: {
    update: (data: UpdateProfileInput) =>
      apiFetch<UserResponse>('/users/me', { method: 'PATCH', body: data }),
    onboarding: (data: OnboardingInput) =>
      apiFetch<UserResponse>('/users/me/onboarding', { method: 'POST', body: data }),
    uploadAvatar: (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      return apiFetch<UserResponse>('/users/me/avatar', { method: 'POST', body: form });
    },
    removeAvatar: () => apiFetch<UserResponse>('/users/me/avatar', { method: 'DELETE' }),
    changePassword: (data: ChangePasswordInput) =>
      apiFetch<MessageResponse>('/users/me/password', { method: 'POST', body: data }),
    deleteAccount: (data: DeleteAccountInput) =>
      apiFetch<MessageResponse>('/users/me', { method: 'DELETE', body: data }),
  },

  admin: {
    stats: () => apiFetch<AdminStats>('/admin/stats'),
    users: (params: { page: number; search?: string }) => {
      const qs = new URLSearchParams({ page: String(params.page) });
      if (params.search) qs.set('search', params.search);
      return apiFetch<Paginated<AdminUserRow>>(`/admin/users?${qs}`);
    },
  },
};
