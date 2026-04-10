import { useMemo } from 'react';
import { globalInvalidationManager } from '../context/InvalidationManager';

export interface UseInvalidationResult {
  /**
   * Invalidate a single entity. All subscribed `useList`, `useById`, and
   * `useRecord` hooks for this entity will refetch in the background via
   * stale-while-revalidate, deduped automatically.
   */
  invalidate: (entity: string) => void;
  /**
   * Invalidate every entity that currently has subscribers. Equivalent to
   * calling `invalidate` on each one. Use sparingly — this triggers a
   * refetch on every active query in the app.
   */
  invalidateAll: () => void;
}

/**
 * Hook that returns imperative invalidation controls for the global cache.
 *
 * Most of the time you don't need this: mutations from the generated api
 * methods (useCreate / useUpdate / usePatch / useDelete) invalidate their
 * entity automatically. Use `useInvalidation` when you need to refresh data
 * after an action that the library doesn't know about — a websocket event,
 * a custom mutation endpoint, a user-triggered refresh button, etc.
 *
 * The returned object has stable identity across renders, so it can be
 * safely passed to effects or memoized callbacks without causing churn.
 *
 * @example
 * ```tsx
 * function RefreshButton() {
 *   const { invalidate } = useInvalidation();
 *   return <button onClick={() => invalidate('todos')}>Refresh todos</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function GlobalRefresh() {
 *   const { invalidateAll } = useInvalidation();
 *   useEffect(() => {
 *     const handler = () => invalidateAll();
 *     window.addEventListener('focus', handler);
 *     return () => window.removeEventListener('focus', handler);
 *   }, [invalidateAll]);
 *   return null;
 * }
 * ```
 */
export function useInvalidation(): UseInvalidationResult {
  return useMemo<UseInvalidationResult>(
    () => ({
      invalidate: (entity: string) => {
        globalInvalidationManager.invalidate(entity);
      },
      invalidateAll: () => {
        globalInvalidationManager.invalidateAll();
      },
    }),
    []
  );
}
