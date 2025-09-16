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
import { useMutation } from '../hooks/useMutation';
import { useQueryWithGlobalState } from '../hooks/useQueryWithGlobalState';
import { useListWithGlobalState } from '../hooks/useListWithGlobalState';
import { useMutationWithGlobalState } from '../hooks/useMutationWithGlobalState';
import { globalInvalidationManager } from '../context/InvalidationManager';

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

export function createDomainApi<T extends z.ZodSchema>(
  entity: string,
  businessSchema: T,
  globalConfig?: GlobalStateConfig
): GeneratedCrudApi<InferType<T>> {
  const useGlobalState = globalConfig?.globalState || false;

  // Setup invalidation rules if specified
  if (globalConfig?.invalidateRelated) {
    globalInvalidationManager.addRule({
      entity,
      invalidates: globalConfig.invalidateRelated,
    });
  }

  type EntityType = CompleteEntityType<InferType<T>>;

  return {
    useList: (params?: ListParams) => {
      if (useGlobalState) {
        return useListWithGlobalState<EntityType>(entity, params, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useList<EntityType>(entity, params);
    },

    useQuery: (id: string | undefined | null) => {
      if (useGlobalState) {
        return useQueryWithGlobalState<EntityType>(entity, `${entity}/${id}`, undefined, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useQuery<EntityType>(id ? `${entity}/${id}` : undefined);
    },

    useById: (id: string | undefined | null) => {
      if (useGlobalState) {
        return useQueryWithGlobalState<EntityType>(entity, `${entity}/${id}`, undefined, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useQuery<EntityType>(id ? `${entity}/${id}` : undefined);
    },

    useCreate: () => {
      if (useGlobalState) {
        return useMutationWithGlobalState<
          Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>,
          EntityType
        >(entity, entity, 'POST', businessSchema, {
          optimistic: globalConfig?.optimistic,
          invalidateRelated: globalConfig?.invalidateRelated,
        });
      }
      return useMutation<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>, EntityType>(
        entity,
        'POST',
        businessSchema
      );
    },

    useUpdate: (id?: string) => {
      if (useGlobalState) {
        return useMutationWithGlobalState<
          Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>,
          EntityType
        >(entity, id ? `${entity}/${id}` : entity, 'PUT', businessSchema, {
          invalidateRelated: globalConfig?.invalidateRelated,
        });
      }
      return useMutation<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>, EntityType>(
        entity,
        'PUT',
        businessSchema
      );
    },

    useDelete: (id?: string) => {
      if (useGlobalState) {
        const mutation = useMutationWithGlobalState<void, void>(
          entity,
          id ? `${entity}/${id}` : entity,
          'DELETE',
          undefined,
          {
            invalidateRelated: globalConfig?.invalidateRelated,
          }
        );
        return {
          ...mutation,
          mutate: (_input: void = undefined, dynamicId?: string) => {
            // For dynamic ID, pass the ID in the data payload for connector extraction
            const dataWithId = dynamicId ? { id: dynamicId } : undefined;
            return mutation.mutate(dataWithId as any, dynamicId);
          },
        };
      }
      const mutation = useMutation<void, void>(entity, 'DELETE');
      return {
        ...mutation,
        mutate: (input: void = undefined, dynamicId?: string) => {
          return mutation.mutate(input, dynamicId || id);
        },
      };
    },
  };
}
