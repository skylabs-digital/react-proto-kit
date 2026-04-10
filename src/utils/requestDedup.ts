/**
 * Request deduplication.
 *
 * Shares inflight promises across concurrent callers that fetch the same
 * resource. Two simultaneous `useList('todos')` instances will now share a
 * single network request instead of firing two in parallel.
 *
 * The map is module-level because the cache layer itself is global (backed by
 * `globalInvalidationManager` and the GlobalStateProvider reducer). In SSR
 * contexts this would leak across requests, but the package is not SSR-safe
 * today (direct `window` / `localStorage` references in connectors and
 * navigation hooks).
 */

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Returns the existing inflight promise for `key` if there is one, otherwise
 * invokes `fetcher`, stores its promise, and removes it from the map once
 * settled (success or failure).
 */
export function dedupeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fetcher();
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Test helper: clears all inflight promises. Not exported from the package.
 */
export function __clearPendingRequests(): void {
  pendingRequests.clear();
}
