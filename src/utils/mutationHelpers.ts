import { z } from 'zod';
import { ErrorResponse } from '../types';
import { debugLogger } from './debug';
import { makeUnknownError, makeValidationError } from './errorResponse';

export function zodIssuesToFieldMap(issues: readonly z.ZodIssue[]): Record<string, string> {
  return issues.reduce((acc: Record<string, string>, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {});
}

export function toValidationErrorResponse<T>(zodError: z.ZodError, input: T): ErrorResponse {
  const fields = zodIssuesToFieldMap(zodError.issues);
  const errorResponse = makeValidationError(fields);
  debugLogger.logValidationError(input, zodError, fields);
  return errorResponse;
}

export function toUnknownErrorResponse(err: unknown): ErrorResponse {
  return makeUnknownError(err);
}
