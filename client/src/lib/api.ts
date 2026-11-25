import {
  API_PREFIX,
  CLIENT_HEADER,
  type AdminStats,
  type AdminUserRow,
  type ApiErrorResponse,
  type ChangePasswordInput,
  type CreateExpenseInput,
  type CreateItemInput,
  type CreatePackingInput,
  type CreateTripInput,
  type DeleteAccountInput,
  type ExchangeRates,
  type ForgotPasswordInput,
  type HealthResponse,
  type LoginInput,
  type MessageResponse,
  type OnboardingInput,
  type PackingTemplateInput,
  type Paginated,
  type ReorderItineraryInput,
  type ResetPasswordInput,
  type SignupInput,
  type TripListResponse,
  type TripResponse,
  type UpdateExpenseInput,
  type UpdateItemInput,
  type UpdatePackingInput,
  type UpdateProfileInput,
  type UpdateTripInput,
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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set to false for requests that must not trigger a refresh (e.g. login). */
  retryOnExpired?: boolean;
}

/** Sends a request (refreshing an expired login once) and throws ApiError for any failure. */
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
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
  return res;
}

/** Small wrapper around fetch: JSON in, JSON out, cookies included, errors thrown as ApiError. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await request(path, options);
  return (await res.json()) as T;
}

/** Downloads a file from the API and hands it to the browser as a download. */
export async function apiDownload(path: string, fallbackName: string) {
  const res = await request(path);
  const blob = await res.blob();
  const header = res.headers.get('content-disposition') ?? '';
  const name = /filename="?([^";]+)"?/.exec(header)?.[1] ?? fallbackName;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  trips: {
    list: () => apiFetch<TripListResponse>('/trips'),
    get: (id: string) => apiFetch<TripResponse>(`/trips/${id}`),
    create: (data: CreateTripInput) => apiFetch<TripResponse>('/trips', { method: 'POST', body: data }),
    update: (id: string, data: UpdateTripInput) =>
      apiFetch<TripResponse>(`/trips/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => apiFetch<MessageResponse>(`/trips/${id}`, { method: 'DELETE' }),
    downloadCalendar: (id: string) => apiDownload(`/trips/${id}/calendar.ics`, 'trip.ics'),

    addItem: (id: string, data: CreateItemInput) =>
      apiFetch<TripResponse>(`/trips/${id}/items`, { method: 'POST', body: data }),
    updateItem: (id: string, itemId: string, data: UpdateItemInput) =>
      apiFetch<TripResponse>(`/trips/${id}/items/${itemId}`, { method: 'PATCH', body: data }),
    removeItem: (id: string, itemId: string) =>
      apiFetch<TripResponse>(`/trips/${id}/items/${itemId}`, { method: 'DELETE' }),
    reorder: (id: string, data: ReorderItineraryInput) =>
      apiFetch<TripResponse>(`/trips/${id}/itinerary`, { method: 'PUT', body: data }),

    addExpense: (id: string, data: CreateExpenseInput) =>
      apiFetch<TripResponse>(`/trips/${id}/expenses`, { method: 'POST', body: data }),
    updateExpense: (id: string, expenseId: string, data: UpdateExpenseInput) =>
      apiFetch<TripResponse>(`/trips/${id}/expenses/${expenseId}`, { method: 'PATCH', body: data }),
    removeExpense: (id: string, expenseId: string) =>
      apiFetch<TripResponse>(`/trips/${id}/expenses/${expenseId}`, { method: 'DELETE' }),

    addPacking: (id: string, data: CreatePackingInput) =>
      apiFetch<TripResponse>(`/trips/${id}/packing`, { method: 'POST', body: data }),
    addPackingTemplate: (id: string, data: PackingTemplateInput) =>
      apiFetch<TripResponse>(`/trips/${id}/packing/template`, { method: 'POST', body: data }),
    unpackAll: (id: string) =>
      apiFetch<TripResponse>(`/trips/${id}/packing/unpack-all`, { method: 'POST' }),
    updatePacking: (id: string, itemId: string, data: UpdatePackingInput) =>
      apiFetch<TripResponse>(`/trips/${id}/packing/${itemId}`, { method: 'PATCH', body: data }),
    removePacking: (id: string, itemId: string) =>
      apiFetch<TripResponse>(`/trips/${id}/packing/${itemId}`, { method: 'DELETE' }),
  },

  currency: {
    rates: () => apiFetch<ExchangeRates>('/currency/rates'),
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
