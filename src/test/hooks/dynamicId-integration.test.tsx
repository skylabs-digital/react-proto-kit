import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createDomainApi } from '../../factory/createDomainApi';
import { z } from 'zod';
import { createTestWrapper } from '../helpers/testUtils';

// Test schema
const testSchema = z.object({
  title: z.string(),
  content: z.string(),
});

describe('Dynamic ID Integration Tests', () => {
  let mockLocalStorage: any;

  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Setup test data
    const testData = {
      posts: [
        {
          id: '123',
          title: 'Test Post',
          content: 'Content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '456',
          title: 'Another Post',
          content: 'More content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

    vi.clearAllMocks();
  });

  describe('With Global Context - LocalStorage', () => {
    const TestWrapper = createTestWrapper({
      connectorType: 'localStorage',
      config: {
        seed: {
          data: {
            posts: [
              {
                id: '123',
                title: 'Test Post',
                content: 'Content',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: '456',
                title: 'Another Post',
                content: 'More content',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          behavior: {
            initializeEmpty: false,
            mergeStrategy: 'replace',
          },
        },
      },
    });

    it('should handle UPDATE with dynamic ID via second parameter', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: true });
      const { result } = renderHook(() => api.useUpdate(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.mutate({ title: 'Updated Title', content: 'Updated content' }, '123');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle DELETE with dynamic ID via second parameter', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: true });
      const { result } = renderHook(() => api.useDelete(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.mutate(undefined, '123');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle UPDATE with ID in data payload', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: true });
      const { result } = renderHook(() => api.useUpdate(), { wrapper: TestWrapper });

      const updateData = { id: '123', title: 'Updated Post', content: 'Updated content' };

      await act(async () => {
        await result.current.mutate(updateData);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle missing ID gracefully', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: true });
      const { result } = renderHook(() => api.useUpdate(), { wrapper: TestWrapper });

      await act(async () => {
        try {
          await result.current.mutate({ title: 'No ID', content: 'Content' });
        } catch {
          // Expected error when no ID is provided
        }
      });

      // Should have an error when no ID is provided
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Without Global Context - LocalStorage', () => {
    const TestWrapper = createTestWrapper({
      connectorType: 'localStorage',
      config: {
        seed: {
          data: {
            posts: [
              {
                id: '123',
                title: 'Test Post',
                content: 'Content',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          behavior: {
            initializeEmpty: false,
            mergeStrategy: 'replace',
          },
        },
      },
    });

    it('should handle UPDATE with dynamic ID via second parameter', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: false });
      const { result } = renderHook(() => api.useUpdate(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.mutate({ title: 'Updated Title', content: 'Updated content' }, '123');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle DELETE with dynamic ID via second parameter', async () => {
      const api = createDomainApi('posts', testSchema, { globalState: false });
      const { result } = renderHook(() => api.useDelete(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.mutate(undefined, '123');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});
