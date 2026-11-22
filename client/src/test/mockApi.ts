import { vi } from 'vitest';

type Handler = { status?: number; body: unknown };

/** Fakes the API: mockApi({ '/auth/me': { body: { user } } }). Unlisted paths answer 401. */
export function mockApi(routes: Record<string, Handler>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = url.replace(/^.*\/api/, '').split('?')[0]!;
      const handler = routes[path] ?? {
        status: 401,
        body: { error: { message: 'Please log in', code: 'UNAUTHENTICATED' } },
      };
      return new Response(JSON.stringify(handler.body), {
        status: handler.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
}
