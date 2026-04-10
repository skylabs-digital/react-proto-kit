/**
 * Stable cache key generation for the global state cache.
 *
 * All GET hooks (useList, useById, useRecord) and mutation hooks use these
 * helpers so that reads and writes target the exact same keys, regardless of
 * property ordering or undefined values in params.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deterministic JSON serialization: sorts object keys recursively so that
 * `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce the same string.
 *
 * Returns an empty string when the input has no meaningful content.
 */
function stableStringify(value: unknown): string {
  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) {
    return '[' + value.map(item => stableStringify(item)).join(',') + ']';
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort();
    if (keys.length === 0) return '';
    const body = keys.map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',');
    return '{' + body + '}';
  }

  return JSON.stringify(value);
}

/**
 * Cache key for a list query. Encodes the endpoint plus list params
 * (pagination/filters) and any query params attached via `withQuery`.
 *
 * Params are typed as `unknown` so consumers can pass through concrete
 * interfaces (e.g. `ListParams`) without having to cast to a record type.
 */
export function listCacheKey(endpoint: string, params?: unknown, queryParams?: unknown): string {
  const parts: string[] = [`list:${endpoint}`];
  const paramsStr = stableStringify(params);
  const queryStr = stableStringify(queryParams);
  if (paramsStr) parts.push(paramsStr);
  if (queryStr) parts.push(queryStr);
  return parts.join(':');
}

/**
 * Cache key for a single entity fetched by id. The id is expected to already
 * be baked into `endpoint` (e.g. `'users/123'`). Callers that hold the id
 * separately should concatenate before calling.
 */
export function byIdCacheKey(endpoint: string): string {
  return endpoint;
}

/**
 * Cache key for a single-record endpoint (no id suffix), optionally including
 * query params so that `withQuery` variants don't collide with the base.
 */
export function recordCacheKey(endpoint: string, queryParams?: unknown): string {
  const queryStr = stableStringify(queryParams);
  return queryStr ? `${endpoint}:${queryStr}` : endpoint;
}
