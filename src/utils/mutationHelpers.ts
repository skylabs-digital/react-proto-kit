import { z } from 'zod';
import { ErrorResponse } from '../types';
import { debugLogger } from './debug';

export function zodIssuesToFieldMap(issues: readonly z.ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {});
}

export function toValidationErrorResponse<T>(zodError: z.ZodError, input: T): ErrorResponse {
  const validation = zodIssuesToFieldMap(zodError.issues);

  const errorResponse: ErrorResponse = {
    success: false,
    message: 'Validation failed',
    error: { code: 'VALIDATION_ERROR' },
    type: 'VALIDATION',
    validation,
  };

  debugLogger.logValidationError(input, zodError, validation);

  return errorResponse;
}

export function toUnknownErrorResponse(err: unknown): ErrorResponse {
  return {
    success: false,
    message: err instanceof Error ? err.message : 'Unknown error',
    error: { code: 'UNKNOWN_ERROR' },
  };
}
