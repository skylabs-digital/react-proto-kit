import { z } from 'zod';
import {
  ApiResponse,
  ErrorResponse,
  ListParams,
  GlobalStateConfig,
  PaginationMeta,
} from '../types';
import { useById } from '../hooks/useById';
import { useList } from '../hooks/useList';
import { useCreateMutation } from '../hooks/useCreateMutation';
import { usePatchMutation } from '../hooks/usePatchMutation';
import { useDeleteMutation } from '../hooks/useDeleteMutation';
import { useUpdateMutation } from '../hooks/useUpdateMutation';

// Query parameters configuration
export interface QueryParamsConfig {
  static?: Record<string, any>; // Always included in requests
  dynamic?: string[]; // Runtime configurable parameters
}

// Complete entity type with auto-generated fields
export type CompleteEntity<T> = T & { id: string; createdAt: string; updatedAt: string };

// Return type interface for proper type inference
export interface DomainApi<TEntity, TUpsert> {
  withParams: (params: Record<string, string>) => DomainApi<TEntity, TUpsert>;
  withQuery: (queryParams: Record<string, any>) => DomainApi<TEntity, TUpsert>;
  useList: (params?: ListParams) => {
    data: CompleteEntity<TEntity>[] | null;
    loading: boolean;
    error: ErrorResponse | null;
    meta?: PaginationMeta;
    refetch: () => Promise<void>;
  };
  useById: (id: string | undefined | null) => {
    data: CompleteEntity<TEntity> | null;
    loading: boolean;
    error: ErrorResponse | null;
    refetch: () => Promise<void>;
  };
  useCreate: () => {
    mutate: (data: TUpsert) => Promise<ApiResponse<CompleteEntity<TEntity>>>;
    loading: boolean;
    error: ErrorResponse | null;
  };
  useUpdate: () => {
    mutate: (id: string, data: TUpsert) => Promise<ApiResponse<CompleteEntity<TEntity>>>;
    loading: boolean;
    error: ErrorResponse | null;
  };
  usePatch: () => {
    mutate: (id: string, data: Partial<TUpsert>) => Promise<ApiResponse<CompleteEntity<TEntity>>>;
    loading: boolean;
    error: ErrorResponse | null;
  };
  useDelete: () => {
    mutate: (id: string) => Promise<ApiResponse<void>>;
    loading: boolean;
    error: ErrorResponse | null;
  };
}

// Type extraction utilities - extract from the return type of createDomainApi or createSingleRecordApi
export type ExtractEntityType<T> = T extends {
  useById: (id: any) => { data: infer U };
}
  ? NonNullable<U>
  : T extends { useRecord: () => { data: infer U } }
    ? NonNullable<U>
    : never;

export type ExtractInputType<T> = T extends {
  useCreate: () => { mutate: (input: infer U) => any };
}
  ? U
  : never;

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

// Overload: 3 arguments (entitySchema is also used as upsertSchema)
export function createDomainApi<TEntity extends z.ZodSchema>(
  pathTemplate: string,
  entitySchema: TEntity,
  config?: GlobalStateConfig & { queryParams?: QueryParamsConfig }
): DomainApi<z.infer<TEntity>, z.infer<TEntity>>;

// Overload: 4 arguments (separate entitySchema and upsertSchema)
export function createDomainApi<TEntity extends z.ZodSchema, TUpsert extends z.ZodSchema>(
  pathTemplate: string,
  entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: GlobalStateConfig & { queryParams?: QueryParamsConfig }
): DomainApi<z.infer<TEntity>, z.infer<TUpsert>>;

// Implementation
export function createDomainApi<TEntity extends z.ZodSchema, TUpsert extends z.ZodSchema>(
  pathTemplate: string,
  _entitySchema: TEntity,
  upsertSchemaOrConfig?: TUpsert | (GlobalStateConfig & { queryParams?: QueryParamsConfig }),
  maybeConfig?: GlobalStateConfig & { queryParams?: QueryParamsConfig }
): DomainApi<z.infer<TEntity>, z.infer<TUpsert>> {
  // Determine if 3 or 4 argument form was used
  const isThreeArgForm =
    upsertSchemaOrConfig &&
    typeof upsertSchemaOrConfig === 'object' &&
    !('_def' in upsertSchemaOrConfig);

  const upsertSchema = isThreeArgForm
    ? (_entitySchema as unknown as TUpsert)
    : (upsertSchemaOrConfig as TUpsert);
  const config = isThreeArgForm
    ? (upsertSchemaOrConfig as GlobalStateConfig & { queryParams?: QueryParamsConfig })
    : maybeConfig;
  type EntityType = CompleteEntity<z.infer<TEntity>>;

  // Extract entity name from path - for nested paths, combine segments
  const segments = pathTemplate.split('/').filter(Boolean);
  const nonParamSegments = segments.filter(segment => !segment.startsWith(':'));
  const entity =
    nonParamSegments.length > 1
      ? nonParamSegments.join('_') // e.g., 'todos/:todoId/comments' → 'todos_comments'
      : nonParamSegments[nonParamSegments.length - 1]; // Simple case: 'todos' → 'todos'

  // Throws a helpful error when a hook is invoked before `withParams` has
  // resolved the dynamic segments of the path.
  const assertPathResolved = (path: string, hookName: string): void => {
    if (!hasUnresolvedParams(path)) return;
    const paramNames = extractParamNames(path);
    throw new Error(
      `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
        `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling ${hookName}().`
    );
  };

  // Immutable builder. Each call to `withParams` / `withQuery` returns a fresh
  // api object bound to the given path and queryParams, so the resolved values
  // flow to every hook — including mutations — via closure instead of mutable
  // module state. This mirrors the pattern already used in createSingleRecordApi.
  const createApi = (
    path: string,
    queryParams: Record<string, any>
  ): DomainApi<z.infer<TEntity>, z.infer<TUpsert>> => {
    // Materialize queryParams once per builder so the same reference is used
    // across all hook invocations returned by this api instance.
    const effectiveQueryParams = Object.keys(queryParams).length > 0 ? queryParams : undefined;

    return {
      withParams: (params: Record<string, string>) =>
        createApi(buildPath(pathTemplate, params), queryParams),

      withQuery: (newQueryParams: Record<string, any>) => {
        // Validate dynamic params against the allowlist, if configured.
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

        // Merge: static < previously-bound dynamic < newly-bound dynamic.
        const staticParams = config?.queryParams?.static || {};
        const merged = { ...staticParams, ...queryParams, ...newQueryParams };
        return createApi(path, merged);
      },

      useList: (listParams?: ListParams) => {
        assertPathResolved(path, 'useList');
        return useList<EntityType>(entity, path, listParams, {
          cacheTime: config?.cacheTime,
          queryParams: effectiveQueryParams,
        });
      },

      useById: (id: string | undefined | null) => {
        assertPathResolved(path, 'useById');
        return useById<EntityType>(entity, id ? `${path}/${id}` : undefined, undefined, {
          cacheTime: config?.cacheTime,
        });
      },

      useCreate: () => {
        assertPathResolved(path, 'useCreate');
        return useCreateMutation<z.infer<TUpsert>, EntityType>(
          entity,
          path,
          upsertSchema as z.ZodSchema<z.infer<TUpsert>>,
          {
            entitySchema: _entitySchema as z.ZodSchema<any>,
            queryParams: effectiveQueryParams,
          }
        );
      },

      useUpdate: () => {
        assertPathResolved(path, 'useUpdate');
        return useUpdateMutation<z.infer<TUpsert>, EntityType>(
          entity,
          path,
          upsertSchema as z.ZodSchema<z.infer<TUpsert>>,
          { queryParams: effectiveQueryParams }
        );
      },

      usePatch: () => {
        assertPathResolved(path, 'usePatch');
        return usePatchMutation<Partial<z.infer<TUpsert>>, EntityType>(entity, path, {
          queryParams: effectiveQueryParams,
        });
      },

      useDelete: () => {
        assertPathResolved(path, 'useDelete');
        return useDeleteMutation<EntityType>(entity, path, {
          queryParams: effectiveQueryParams,
        });
      },
    };
  };

  // Seed the initial builder with the template path and the static query
  // params from config (if any). `withQuery` will merge its arguments on top.
  const initialQueryParams = { ...(config?.queryParams?.static || {}) };
  return createApi(pathTemplate, initialQueryParams);
}
