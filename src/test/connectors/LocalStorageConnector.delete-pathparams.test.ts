import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageConnector } from '../../connectors/LocalStorageConnector';

describe('LocalStorageConnector.delete with pathParams', () => {
  let connector: LocalStorageConnector;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true,
    });

    connector = new LocalStorageConnector({
      simulateDelay: 0,
      errorRate: 0,
    });
  });

  it('only deletes the item matching both id and pathParams', async () => {
    // Two items sharing the same id but belonging to different parents.
    // This simulates a seeded dataset where ids are not globally unique.
    const seed = {
      todos_comments: [
        { id: 'X', todosId: '123', body: 'belongs to 123' },
        { id: 'X', todosId: '456', body: 'belongs to 456' },
        { id: 'Y', todosId: '123', body: 'untouched' },
      ],
    };
    store['api_client_data'] = JSON.stringify(seed);

    const response = await connector.delete('todos/123/comments/X');

    expect(response.success).toBe(true);

    const persisted = JSON.parse(store['api_client_data']);
    expect(persisted.todos_comments).toHaveLength(2);
    // The item under todosId=123 is gone, the one under todosId=456 survives.
    expect(
      persisted.todos_comments.find((c: any) => c.id === 'X' && c.todosId === '456')
    ).toBeTruthy();
    expect(
      persisted.todos_comments.find((c: any) => c.id === 'X' && c.todosId === '123')
    ).toBeUndefined();
    expect(
      persisted.todos_comments.find((c: any) => c.id === 'Y' && c.todosId === '123')
    ).toBeTruthy();
  });

  it('returns NOT_FOUND when no item matches both id and pathParams', async () => {
    const seed = {
      todos_comments: [{ id: 'X', todosId: '999', body: 'different parent' }],
    };
    store['api_client_data'] = JSON.stringify(seed);

    const response = await connector.delete('todos/123/comments/X');

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error?.code).toBe('NOT_FOUND');
    }

    // Nothing was touched.
    const persisted = JSON.parse(store['api_client_data']);
    expect(persisted.todos_comments).toHaveLength(1);
  });
});
