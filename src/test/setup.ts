import { vi, beforeEach } from 'vitest';

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn(...args);
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
Object.defineProperty(window, 'fetch', {
  value: vi.fn(),
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
