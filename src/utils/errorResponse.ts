import { ErrorResponse } from '../types';

/**
 * Centralized factories for every variant of {@link ErrorResponse}. All
 * library code must route through these — direct object literals of the
 * `{ success: false, ... }` shape are forbidden outside this file so the
 * discriminated union stays airtight.
 */

export function makeValidationError(
  fields: Record<string, string>,
  message = 'Validation failed',
  details?: unknown
): ErrorResponse {
  return { success: false, kind: 'validation', message, fields, details };
}

export function makeAuthError(
  message = 'Authentication required',
  details?: unknown
): ErrorResponse {
  return { success: false, kind: 'auth', message, details };
}

export function makeNotFoundError(
  message = 'Resource not found',
  details?: unknown
): ErrorResponse {
  return { success: false, kind: 'notFound', message, details };
}

export function makeTimeoutError(message = 'Request timeout'): ErrorResponse {
  return { success: false, kind: 'timeout', message };
}

export function makeNetworkError(message = 'Network error', details?: unknown): ErrorResponse {
  return { success: false, kind: 'network', message, details };
}

export function makeHttpError(
  status: number,
  message?: string,
  code?: string,
  details?: unknown
): ErrorResponse {
  const base = {
    success: false as const,
    kind: 'http' as const,
    status,
    message: message ?? `HTTP ${status}`,
  };
  return {
    ...base,
    ...(code !== undefined ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  };
}

export function makeUnknownError(err: unknown): ErrorResponse {
  return {
    success: false,
    kind: 'unknown',
    message: err instanceof Error ? err.message : 'Unknown error',
    ...(err !== undefined ? { details: err } : {}),
  };
}

/**
 * Maps an HTTP status + optional backend body to the correct
 * ErrorResponse variant. Lives here so every connector agrees on the mapping.
 */
export function httpErrorFromResponse(
  status: number,
  body: {
    message?: string;
    code?: string;
    validation?: Record<string, string>;
    [key: string]: unknown;
  }
): ErrorResponse {
  const { message, code, validation, ...rest } = body;
  const details = Object.keys(rest).length > 0 ? rest : undefined;

  if (validation && typeof validation === 'object' && Object.keys(validation).length > 0) {
    return makeValidationError(validation, message ?? 'Validation failed', details);
  }

  if (status === 401 || status === 403) {
    return makeAuthError(message ?? `HTTP ${status}`, details);
  }

  if (status === 404) {
    return makeNotFoundError(message ?? 'Resource not found', details);
  }

  if (status === 422) {
    return makeValidationError(validation ?? {}, message ?? 'Validation failed', details);
  }

  return makeHttpError(status, message, code, details);
}
