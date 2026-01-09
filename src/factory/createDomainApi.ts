import { z } from 'zod';
import { ListParams, GlobalStateConfig } from '../types';
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
    error: any;
    meta?: any;
    refetch: () => Promise<void>;
  };
  useById: (id: string | undefined | null) => {
    data: CompleteEntity<TEntity> | null;
    loading: boolean;
    error: any;
    refetch: () => Promise<void>;
  };
  useCreate: () => {
    mutate: (data: TUpsert) => Promise<CompleteEntity<TEntity>>;
    loading: boolean;
    error: any;
  };
  useUpdate: () => {
    mutate: (id: string, data: TUpsert) => Promise<void>;
    loading: boolean;
    error: any;
  };
  usePatch: () => {
    mutate: (id: string, data: Partial<TUpsert>) => Promise<void>;
    loading: boolean;
    error: any;
  };
  useDelete: () => {
    mutate: (id: string) => Promise<void>;
    loading: boolean;
    error: any;
  };
}

// Type extraction utilities - extract from the return type of createDomainApi
export type ExtractEntityType<T> = T extends {
  useById: (id: any) => { data: infer U };
}
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

  // Current resolved path (starts as template)
  let currentPath = pathTemplate;
  // Current query parameters
  let currentQueryParams: Record<string, any> = {};

  // Extract entity name from path - for nested paths, combine segments
  const segments = pathTemplate.split('/').filter(Boolean);
  const nonParamSegments = segments.filter(segment => !segment.startsWith(':'));
  const entity =
    nonParamSegments.length > 1
      ? nonParamSegments.join('_') // e.g., 'todos/:todoId/comments' → 'todos_comments'
      : nonParamSegments[nonParamSegments.length - 1]; // Simple case: 'todos' → 'todos'

  const api = {
    // Optional method to inject path parameters
    withParams: (params: Record<string, string>) => {
      currentPath = buildPath(pathTemplate, params);
      return api; // Return self for chaining
    },

    // Optional method to inject query parameters
    withQuery: (queryParams: Record<string, any>) => {
      // Validate that only allowed dynamic params are used
      if (config?.queryParams?.dynamic) {
        const allowedParams = config.queryParams.dynamic;
        const invalidParams = Object.keys(queryParams).filter(key => !allowedParams.includes(key));
        if (invalidParams.length > 0) {
          throw new Error(
            `Invalid query parameters: ${invalidParams.join(', ')}. ` +
              `Allowed parameters: ${allowedParams.join(', ')}`
          );
        }
      }

      // Merge static params with dynamic params
      const staticParams = config?.queryParams?.static || {};
      const mergedQueryParams = { ...staticParams, ...queryParams };

      // Return a NEW API object with query params baked in
      // This ensures each call to withQuery creates a fresh builder
      return {
        ...api,
        useList: (params?: ListParams) => {
          if (hasUnresolvedParams(currentPath)) {
            const paramNames = extractParamNames(currentPath);
            throw new Error(
              `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
                `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useList().`
            );
          }

          return useList<EntityType>(entity, currentPath, params, {
            cacheTime: config?.cacheTime,
            queryParams: Object.keys(mergedQueryParams).length > 0 ? mergedQueryParams : undefined,
          });
        },
      };
    },

    useList: (params?: ListParams) => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useList().`
        );
      }
      // Merge static params with any existing query params
      const staticParams = config?.queryParams?.static || {};
      const finalQueryParams = { ...staticParams, ...currentQueryParams };

      return useList<EntityType>(entity, currentPath, params, {
        cacheTime: config?.cacheTime,
        queryParams: Object.keys(finalQueryParams).length > 0 ? finalQueryParams : undefined,
      });
    },

    useById: (id: string | undefined | null) => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useById().`
        );
      }
      return useById<EntityType>(entity, id ? `${currentPath}/${id}` : undefined, undefined, {
        cacheTime: config?.cacheTime,
      });
    },

    useCreate: () => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useCreate().`
        );
      }
      return useCreateMutation<z.infer<TUpsert>, EntityType>(
        entity, // Entity name for global state: 'todos_comments'
        currentPath, // Endpoint for requests: 'todos/123/comments'
        upsertSchema as z.ZodSchema<z.infer<TUpsert>>,
        {
          optimistic: config?.optimistic,
          entitySchema: _entitySchema as z.ZodSchema<any>,
        }
      );
    },

    useUpdate: () => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useUpdate().`
        );
      }
      return useUpdateMutation<z.infer<TUpsert>, EntityType>(
        entity, // Entity name for global state: 'todos_comments'
        currentPath, // Endpoint for requests: 'todos/123/comments'
        upsertSchema as z.ZodSchema<z.infer<TUpsert>>
      );
    },

    usePatch: () => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling usePatch().`
        );
      }
      return usePatchMutation<Partial<z.infer<TUpsert>>, EntityType>(entity, currentPath);
    },

    useDelete: () => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useDelete().`
        );
      }
      return useDeleteMutation<EntityType>(entity, currentPath);
    },
  };

  return api;
}
