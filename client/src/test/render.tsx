import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { PublicUser } from '@tt/shared';
import { ThemeProvider } from '@/lib/theme';
import { routes } from '@/router';

/** Renders the whole app at an address, like opening that page in a browser. */
export function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return router;
}

export const TEST_USER: PublicUser = {
  id: 'u1',
  name: 'Ayesha Rahman',
  email: 'ayesha@example.com',
  role: 'user',
  emailVerified: true,
  avatarUrl: null,
  bio: '',
  homeCountry: 'BD',
  travelStyles: ['food'],
  dreamDestination: 'Kyoto',
  profileVisibility: 'private',
  onboardingCompleted: true,
  xp: 150,
  level: 2,
  createdAt: '2026-10-01T00:00:00.000Z',
};
