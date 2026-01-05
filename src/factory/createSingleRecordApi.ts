import { z } from 'zod';
import { useRecord } from '../hooks/useRecord';
import {
  useSingleRecordUpdate,
  useSingleRecordPatch,
  useSingleRecordReset,
} from '../hooks/useSingleRecordMutation';
import { QueryParamsConfig } from './createDomainApi';

// Helper function to replace path parameters with actual values
function buildPath(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

// Helper function to check if path has unresolved parameters
function hasUnresolvedParams(path: string): boolean {
  return path.includes(':');
}

// Helper function to extract parameter names from path template
function extractParamNames(template: string): string[] {
  const matches = template.match(/:(\w+)/g);
  return matches ? matches.map(match => match.slice(1)) : [];
}

// Re-export QueryParamsConfig for convenience
export type { QueryParamsConfig };

// Single Record API configuration
export interface SingleRecordConfig {
  cacheTime?: number;
  queryParams?: QueryParamsConfig;
  refetchInterval?: number;
  allowReset?: boolean;
}

// Type for useRecord result
export interface UseRecordResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

// Type for mutation result (simplified)
export interface UseSingleRecordMutationResult<TInput> {
  mutate: (data: TInput) => Promise<void>;
  loading: boolean;
  error: any;
}

// Type for reset mutation result
export interface UseResetResult {
  mutate: () => Promise<void>;
  loading: boolean;
  error: any;
}

/**
 * Creates an API for single-record endpoints (not lists).
 *
 * Use cases:
 * - User settings: GET/PUT/PATCH /users/:userId/settings
 * - App config: GET/PUT /config
 * - User profile: GET/PATCH /users/:userId/profile
 *
 * @example
 * ```typescript
 * const settingsApi = createSingleRecordApi(
 *   'users/:userId/settings',
 *   settingsSchema,
 *   settingsInputSchema,
 *   { allowReset: true }
 * );
 *
 * // In component
 * const api = settingsApi.withParams({ userId: '123' });
 * const { data, loading } = api.useRecord();
 * const { mutate: update } = api.useUpdate();
 * const { mutate: patch } = api.usePatch();
 * const { mutate: reset } = api.useReset();
 * ```
 */
export function createSingleRecordApi<TEntity extends z.ZodSchema, TUpsert extends z.ZodSchema>(
  pathTemplate: string,
  _entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: SingleRecordConfig
) {
  type EntityType = z.infer<TEntity>;
  type UpsertType = z.infer<TUpsert>;

  // Current resolved path
  let currentPath = pathTemplate;
  let currentQueryParams: Record<string, any> = {};

  // Extract entity name from path
  const segments = pathTemplate.split('/').filter(Boolean);
  const nonParamSegments = segments.filter(segment => !segment.startsWith(':'));
  const entity =
    nonParamSegments.length > 1
      ? nonParamSegments.join('_')
      : nonParamSegments[nonParamSegments.length - 1];

  const createApi = (path: string, queryParams: Record<string, any>) => ({
    withParams: (params: Record<string, string>) => {
      const newPath = buildPath(pathTemplate, params);
      return createApi(newPath, queryParams);
    },

    withQuery: (newQueryParams: Record<string, any>) => {
      // Validate dynamic params
      if (config?.queryParams?.dynamic) {
        const allowedParams = config.queryParams.dynamic;
        const invalidParams = Object.keys(newQueryParams).filter(
          key => !allowedParams.includes(key)
        );
        if (invalidParams.length > 0) {
          throw new Error(
            `Invalid query parameters: ${invalidParams.join(', ')}. ` +
              `Allowed parameters: ${allowedParams.join(', ')}`
          );
        }
      }

      // Merge static and dynamic params
      const staticParams = config?.queryParams?.static || {};
      const mergedParams = { ...staticParams, ...queryParams, ...newQueryParams };
      return createApi(path, mergedParams);
    },

    useRecord: (): UseRecordResult<EntityType> => {
      if (hasUnresolvedParams(path)) {
        const paramNames = extractParamNames(path);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useRecord().`
        );
      }

      // Merge static params
      const staticParams = config?.queryParams?.static || {};
      const finalQueryParams = { ...staticParams, ...queryParams };

      return useRecord<EntityType>(entity, path, {
        cacheTime: config?.cacheTime,
        refetchInterval: config?.refetchInterval,
        queryParams: Object.keys(finalQueryParams).length > 0 ? finalQueryParams : undefined,
      });
    },

    useUpdate: (): UseSingleRecordMutationResult<UpsertType> => {
      if (hasUnresolvedParams(path)) {
        const paramNames = extractParamNames(path);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useUpdate().`
        );
      }

      // Use single record update hook - no ID appending
      return useSingleRecordUpdate<UpsertType, EntityType>(
        entity,
        path,
        upsertSchema as z.ZodSchema<UpsertType>
      );
    },

    usePatch: (): UseSingleRecordMutationResult<Partial<UpsertType>> => {
      if (hasUnresolvedParams(path)) {
        const paramNames = extractParamNames(path);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling usePatch().`
        );
      }

      // Use single record patch hook - no ID appending
      return useSingleRecordPatch<Partial<UpsertType>, EntityType>(entity, path);
    },

    useReset: (): UseResetResult => {
      if (!config?.allowReset) {
        throw new Error('useReset is not enabled. Set allowReset: true in config to enable it.');
      }

      if (hasUnresolvedParams(path)) {
        const paramNames = extractParamNames(path);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useReset().`
        );
      }

      // Use single record reset hook - no ID appending
      return useSingleRecordReset<EntityType>(entity, path);
    },
  });

  return createApi(currentPath, currentQueryParams);
}

/**
 * Creates a read-only API for single-record endpoints.
 *
 * Use cases:
 * - Dashboard stats: GET /dashboard/stats
 * - Analytics: GET /analytics/summary
 * - Computed data: GET /users/:userId/insights
 *
 * @example
 * ```typescript
 * const statsApi = createSingleRecordReadOnlyApi(
 *   'dashboard/stats',
 *   statsSchema,
 *   { refetchInterval: 30000 } // Auto-refresh every 30 seconds
 * );
 *
 * // In component
 * const { data, loading, refetch } = statsApi.useRecord();
 * ```
 */
export function createSingleRecordReadOnlyApi<TEntity extends z.ZodSchema>(
  pathTemplate: string,
  _entitySchema: TEntity,
  config?: Omit<SingleRecordConfig, 'allowReset'>
) {
  type EntityType = z.infer<TEntity>;

  let currentPath = pathTemplate;
  let currentQueryParams: Record<string, any> = {};

  const segments = pathTemplate.split('/').filter(Boolean);
  const nonParamSegments = segments.filter(segment => !segment.startsWith(':'));
  const entity =
    nonParamSegments.length > 1
      ? nonParamSegments.join('_')
      : nonParamSegments[nonParamSegments.length - 1];

  const createApi = (path: string, queryParams: Record<string, any>) => ({
    withParams: (params: Record<string, string>) => {
      const newPath = buildPath(pathTemplate, params);
      return createApi(newPath, queryParams);
    },

    withQuery: (newQueryParams: Record<string, any>) => {
      if (config?.queryParams?.dynamic) {
        const allowedParams = config.queryParams.dynamic;
        const invalidParams = Object.keys(newQueryParams).filter(
          key => !allowedParams.includes(key)
        );
        if (invalidParams.length > 0) {
          throw new Error(
            `Invalid query parameters: ${invalidParams.join(', ')}. ` +
              `Allowed parameters: ${allowedParams.join(', ')}`
          );
        }
      }

      const staticParams = config?.queryParams?.static || {};
      const mergedParams = { ...staticParams, ...queryParams, ...newQueryParams };
      return createApi(path, mergedParams);
    },

    useRecord: (): UseRecordResult<EntityType> => {
      if (hasUnresolvedParams(path)) {
        const paramNames = extractParamNames(path);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useRecord().`
        );
      }

      const staticParams = config?.queryParams?.static || {};
      const finalQueryParams = { ...staticParams, ...queryParams };

      return useRecord<EntityType>(entity, path, {
        cacheTime: config?.cacheTime,
        refetchInterval: config?.refetchInterval,
        queryParams: Object.keys(finalQueryParams).length > 0 ? finalQueryParams : undefined,
      });
    },
  });

  return createApi(currentPath, currentQueryParams);
}
