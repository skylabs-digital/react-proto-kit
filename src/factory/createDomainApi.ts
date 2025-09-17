import { z } from 'zod';
import {
  GeneratedCrudApi,
  ListParams,
  InferType,
  GlobalStateConfig,
  CompleteEntityType,
} from '../types';
import { useQuery } from '../hooks/useQuery';
import { useList } from '../hooks/useList';
import { useCreateMutation } from '../hooks/useCreateMutation';
import { usePatchMutation } from '../hooks/usePatchMutation';
import { useDeleteMutation } from '../hooks/useDeleteMutation';
import { useUpdateMutation } from '../hooks/useUpdateMutation';

// Type extraction utilities - simple and clean
export type ExtractEntityType<T> =
  T extends GeneratedCrudApi<infer U>
    ? U & { id: string; createdAt: string; updatedAt: string }
    : T extends Pick<GeneratedCrudApi<infer U>, any>
      ? U & { id: string; createdAt: string; updatedAt: string }
      : never;
export type ExtractInputType<T> =
  T extends GeneratedCrudApi<infer U>
    ? Omit<U, 'id' | 'createdAt' | 'updatedAt'>
    : T extends Pick<GeneratedCrudApi<infer U>, any>
      ? Omit<U, 'id' | 'createdAt' | 'updatedAt'>
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

// Helper function to extract parameter names from path
function extractParamNames(path: string): string[] {
  const matches = path.match(/:(\w+)/g);
  return matches ? matches.map(match => match.substring(1)) : [];
}

export function createDomainApi<TEntity extends z.ZodSchema, TUpsert extends z.ZodSchema>(
  pathTemplate: string,
  _entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: GlobalStateConfig
) {
  type EntityType = CompleteEntityType<InferType<TEntity>>;

  // Current resolved path (starts as template)
  let currentPath = pathTemplate;
  // Extract entity name from path - for nested paths, combine segments
  const segments = pathTemplate.split('/').filter(Boolean);
  const nonParamSegments = segments.filter(segment => !segment.startsWith(':'));
  const entity =
    nonParamSegments.length > 1
      ? nonParamSegments.join('_') // e.g., 'todos/:todoId/comments' → 'todos_comments'
      : segments[segments.length - 1].replace(':', ''); // Simple case: 'todos' → 'todos'

  console.log('🔍 createDomainApi entity name:', {
    pathTemplate,
    segments,
    nonParamSegments,
    entity,
  });

  const api = {
    // Optional method to inject path parameters
    withParams: (params: Record<string, string>) => {
      currentPath = buildPath(pathTemplate, params);
      return api; // Return self for chaining
    },

    useList: (params?: ListParams) => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useList().`
        );
      }
      console.log('🔍 useList called with:', { entity, currentPath, params });
      return useList<EntityType>(entity, currentPath, params, {
        cacheTime: config?.cacheTime,
      });
    },

    useQuery: (id: string | undefined | null) => {
      if (hasUnresolvedParams(currentPath)) {
        const paramNames = extractParamNames(currentPath);
        throw new Error(
          `Path parameters required but not provided. Missing parameters: ${paramNames.join(', ')}. ` +
            `Use .withParams({ ${paramNames.map(name => `${name}: 'value'`).join(', ')} }) before calling useQuery().`
        );
      }
      return useQuery<EntityType>(entity, id ? `${currentPath}/${id}` : undefined, undefined, {
        cacheTime: config?.cacheTime,
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
      return useQuery<EntityType>(entity, id ? `${currentPath}/${id}` : undefined, undefined, {
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
