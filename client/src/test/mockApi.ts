import { vi } from 'vitest';

type Handler = { status?: number; body: unknown };

/**
 * Fakes the API: mockApi({ '/auth/me': { body: { user } } }).
 * A key can name the method too, which wins over the plain path: 'PATCH /trips/t1'.
 * Unlisted paths answer 401. Returns the fake fetch, so tests can check what was sent.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const path = url.replace(/^.*\/api/, '').split('?')[0]!;
    const method = (init?.method ?? 'GET').toUpperCase();
    const handler = routes[`${method} ${path}`] ??
      routes[path] ?? {
        status: 401,
        body: { error: { message: 'Please log in', code: 'UNAUTHENTICATED' } },
      };
    return new Response(JSON.stringify(handler.body), {
      status: handler.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
