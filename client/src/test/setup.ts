import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockApi } from './mockApi';

afterEach(() => cleanup());

// jsdom (the fake browser used in tests) lacks a few browser features the app uses
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

/** By default the fake API says "not logged in". Tests can replace this with mockApi(). */
beforeEach(() => {
  mockApi({});
});
