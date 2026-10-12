import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from '@/lib/theme';
import { routes } from './router';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('routing', () => {
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

  it('shows a friendly 404 for unknown pages', async () => {
    renderAt('/nowhere');
    expect(await screen.findByText(/went off the map/i)).toBeInTheDocument();
  });
});
