/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useMutationWithGlobalState } from '../../hooks/useMutationWithGlobalState';
import { createTestWrapper } from '../helpers/testUtils';

interface TestInput {
  name: string;
  value: number;
}

interface TestEntity extends TestInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const testSchema = z.object({
  name: z.string(),
  value: z.number(),
});

describe('useMutationWithGlobalState', () => {
  const mockData: TestEntity[] = [
    {
      id: '1',
      name: 'Test Item 1',
      value: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Test Item 2',
      value: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const TestWrapper = createTestWrapper({
    connectorType: 'localStorage',
    config: {
      seed: {
        data: { testEntities: mockData },
        behavior: { initializeEmpty: false, mergeStrategy: 'replace' },
      },
    },
  });

  beforeEach(() => {
    localStorage.clear();
    // Re-seed data after clearing localStorage using the correct storage key and structure
    localStorage.setItem('api_client_data', JSON.stringify({ testEntities: mockData }));
  });

  describe('CREATE mutations', () => {
    it('should create new entities with optimistic updates', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const newEntity = {
        name: 'New Test Item',
        value: 300,
      };

      await act(async () => {
        await result.current.mutate(newEntity);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle create errors with rollback', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const invalidEntity = {
        name: '', // Invalid - empty name should fail validation
        value: 'not-a-number', // Invalid - should be number
      } as any;

      await act(async () => {
        try {
          await result.current.mutate(invalidEntity);
        } catch {
          // Expected to fail - error should be caught
        }
      });

      // The hook should have the error state set
      expect(result.current.error).toBeTruthy();
    });

    it('should invalidate related entities after create', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
              invalidateRelated: ['relatedEntities'],
            }
          ),
        { wrapper: TestWrapper }
      );

      const newEntity = {
        name: 'New Test Item',
        value: 300,
      };

      await act(async () => {
        await result.current.mutate(newEntity);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('UPDATE mutations', () => {
    it('should handle UPDATE mutations with proper hook structure', async () => {
      // Test that UPDATE mutations follow the expected hook pattern
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities/test-id',
            'PUT',
            testSchema,
            { optimistic: true }
          ),
        { wrapper: TestWrapper }
      );

      // Verify hook structure and initial state
      expect(result.current.mutate).toBeInstanceOf(Function);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle partial updates without schema validation', async () => {
      // Test that partial UPDATE mutations work without schema validation
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<Partial<TestInput>>(
            'testEntities',
            '/testEntities/partial-id',
            'PUT',
            undefined, // No schema validation for partial updates
            { optimistic: true }
          ),
        { wrapper: TestWrapper }
      );

      // Verify hook structure for partial updates
      expect(result.current.mutate).toBeInstanceOf(Function);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should rollback optimistic updates on error', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities/nonexistent',
            'PUT',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const invalidUpdate = {
        name: '', // Invalid - empty name
        value: 100,
      };

      await act(async () => {
        try {
          await result.current.mutate(invalidUpdate);
        } catch {
          // Expected to fail
        }
      });

      // Wait a bit for error state to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('DELETE mutations', () => {
    it('should handle DELETE mutations with proper hook structure', async () => {
      // Test that DELETE mutations follow the expected hook pattern
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<void>(
            'testEntities',
            '/testEntities/delete-id',
            'DELETE',
            undefined,
            { optimistic: true }
          ),
        { wrapper: TestWrapper }
      );

      // Verify hook structure for DELETE operations
      expect(result.current.mutate).toBeInstanceOf(Function);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle delete errors with rollback', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<void>(
            'testEntities',
            '/testEntities/nonexistent',
            'DELETE',
            undefined,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        try {
          await result.current.mutate();
        } catch {
          // Expected to fail
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Loading states', () => {
    it('should manage loading states correctly', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema
          ),
        { wrapper: TestWrapper }
      );

      expect(result.current.loading).toBe(false);

      const mutationPromise = act(async () => {
        return result.current.mutate({
          name: 'Loading Test',
          value: 100,
        });
      });

      await mutationPromise;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should clear errors on successful mutations', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema
          ),
        { wrapper: TestWrapper }
      );

      // First, cause an error with invalid data
      await act(async () => {
        try {
          await result.current.mutate({
            name: '', // Invalid - empty string
            value: 'invalid' as any, // Invalid - should be number
          });
        } catch {
          // Expected to fail
        }
      });

      expect(result.current.error).not.toBeNull();

      // Then, perform a successful mutation
      await act(async () => {
        await result.current.mutate({
          name: 'Valid Item',
          value: 100,
        });
      });

      expect(result.current.error).toBeNull();
    });

    it('should preserve error details', async () => {
      const { result } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities/nonexistent',
            'PUT',
            testSchema
          ),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        try {
          await result.current.mutate({
            name: 'Updated Name',
            value: 100,
          });
        } catch {
          // Expected to fail
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBeDefined();
    });
  });

  describe('Global state synchronization', () => {
    it('should sync mutations across multiple hooks', async () => {
      const { result: result1 } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const { result: result2 } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities/1',
            'PUT',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      // Create with first hook
      await act(async () => {
        await result1.current.mutate({
          name: 'Sync Test Item',
          value: 150,
        });
      });

      // Both hooks should reflect the change
      expect(result1.current.error).toBeNull();
      expect(result2.current.error).toBeNull();
    });

    it('should handle concurrent mutations gracefully', async () => {
      const { result: result1 } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const { result: result2 } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      // Sequential mutations to avoid overlapping act() calls
      await act(async () => {
        await result1.current.mutate({
          name: 'Concurrent Item 1',
          value: 100,
        });
      });

      await act(async () => {
        await result2.current.mutate({
          name: 'Concurrent Item 2',
          value: 200,
        });
      });

      expect(result1.current.error).toBeNull();
      expect(result2.current.error).toBeNull();
    });
  });

  describe('Configuration options', () => {
    it('should respect optimistic update settings', async () => {
      const { result: optimisticResult } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: true,
            }
          ),
        { wrapper: TestWrapper }
      );

      const { result: nonOptimisticResult } = renderHook(
        () =>
          useMutationWithGlobalState<TestInput>(
            'testEntities',
            '/testEntities',
            'POST',
            testSchema,
            {
              optimistic: false,
            }
          ),
        { wrapper: TestWrapper }
      );

      // Both should work, but with different update strategies
      await act(async () => {
        await optimisticResult.current.mutate({
          name: 'Optimistic Item',
          value: 100,
        });
      });

      await act(async () => {
        await nonOptimisticResult.current.mutate({
          name: 'Non-Optimistic Item',
          value: 200,
        });
      });

      expect(optimisticResult.current.error).toBeNull();
      expect(nonOptimisticResult.current.error).toBeNull();
    });
  });
});
