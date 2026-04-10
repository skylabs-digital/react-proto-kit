// The global test setup mocks localStorage with inert vi.fn() stubs that do not
// persist state. Tests that exercise the LocalStorageConnector need a functional
// in-memory implementation so data can round-trip (create → read, update, etc).
export function installInMemoryLocalStorage(): () => void {
  const original = window.localStorage;
  const store: Record<string, string> = {};

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    },
  });

  return () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: original,
    });
  };
}
