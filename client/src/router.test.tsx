import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { PublicUser } from '@tt/shared';
import { ThemeProvider } from '@/lib/theme';
import { mockApi } from '@/test/mockApi';
import { routes } from './router';

function renderAt(path: string) {
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

const USER: PublicUser = {
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

describe('routing for visitors', () => {
  it('shows Explore on the home page', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /where to/i })).toBeInTheDocument();
  });

  it('shows all five main tabs', async () => {
    renderAt('/');
    for (const label of ['Explore', 'Trips', 'Map', 'Community', 'Me']) {
      expect((await screen.findAllByRole('link', { name: label })).length).toBeGreaterThan(0);
    }
  });

  it('shows the log in form', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('sends visitors from settings to log in, remembering where they were going', async () => {
    const router = renderAt('/me/settings');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(router.state.location.search).toContain('next=%2Fme%2Fsettings');
  });

  it('shows a friendly 404 for unknown pages', async () => {
    renderAt('/nowhere');
    expect(await screen.findByText(/went off the map/i)).toBeInTheDocument();
  });
});

describe('routing for logged-in users', () => {
  it('greets the user by name and shows their level', async () => {
    mockApi({ '/auth/me': { body: { user: USER } } });
    renderAt('/');
    expect((await screen.findAllByText(/Ayesha/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Level 2/).length).toBeGreaterThan(0);
  });

  it('keeps normal users out of the admin dashboard', async () => {
    mockApi({ '/auth/me': { body: { user: USER } } });
    const router = renderAt('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: /where to/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('sends logged-in users away from the log in page', async () => {
    mockApi({ '/auth/me': { body: { user: USER } } });
    const router = renderAt('/login');
    expect(await screen.findByRole('heading', { level: 1, name: /where to/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});
