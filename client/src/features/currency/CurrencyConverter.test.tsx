import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockApi } from '@/test/mockApi';
import { CurrencyConverter } from './CurrencyConverter';

function renderConverter() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CurrencyConverter />
    </QueryClientProvider>,
  );
}

describe('currency converter', () => {
  it('converts with live rates and swaps currencies', async () => {
    mockApi({
      '/currency/rates': {
        body: { base: 'USD', rates: { USD: 1, EUR: 0.9, BDT: 120 }, updatedAt: '2026-10-13T00:00:00Z', source: 'exchangerate-api' },
      },
    });
    renderConverter();

    // Visitors start from US dollars to euros
    expect(await screen.findByText('1 USD = 0.9 EUR')).toBeInTheDocument();
    expect(screen.getByText(/€90\.00/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'BDT' } });
    expect(await screen.findByText('1 USD = 120 BDT')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /swap/i }));
    expect(await screen.findByText(/1 BDT = 0\.008333/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /exchange rate api/i })).toBeInTheDocument();
  });

  it('explains when rates are unavailable', async () => {
    mockApi({
      '/currency/rates': {
        status: 503,
        body: { error: { message: 'Exchange rates are unavailable right now.', code: 'RATES_UNAVAILABLE' } },
      },
    });
    renderConverter();
      expect(await screen.findByText(/unavailable right now/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
