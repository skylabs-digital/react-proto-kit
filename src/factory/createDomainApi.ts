import { z } from 'zod';
import { GeneratedCrudApi, ListParams, InferType, GlobalStateConfig } from '../types';
import { useQuery } from '../hooks/useQuery';
import { useList } from '../hooks/useList';
import { useMutation } from '../hooks/useMutation';
import { useQueryWithGlobalState } from '../hooks/useQueryWithGlobalState';
import { useListWithGlobalState } from '../hooks/useListWithGlobalState';
import { useMutationWithGlobalState } from '../hooks/useMutationWithGlobalState';
import { globalInvalidationManager } from '../context/InvalidationManager';

export function createDomainApi<T extends z.ZodSchema>(
  entity: string,
  schema: T,
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

  return {
    useList: (params?: ListParams) => {
      if (useGlobalState) {
        return useListWithGlobalState<InferType<T>>(entity, params, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useList<InferType<T>>(entity, params);
    },

    useQuery: (id: string) => {
      if (useGlobalState) {
        return useQueryWithGlobalState<InferType<T>>(entity, `${entity}/${id}`, undefined, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useQuery<InferType<T>>(`${entity}/${id}`);
    },

    useById: (id: string) => {
      if (useGlobalState) {
        return useQueryWithGlobalState<InferType<T>>(entity, `${entity}/${id}`, undefined, {
          cacheTime: globalConfig?.cacheTime,
        });
      }
      return useQuery<InferType<T>>(`${entity}/${id}`);
    },

    useCreate: () => {
      if (useGlobalState) {
        return useMutationWithGlobalState<Partial<InferType<T>>, InferType<T>>(
          entity,
          entity,
          'POST',
          schema,
          {
            optimistic: globalConfig?.optimistic,
            invalidateRelated: globalConfig?.invalidateRelated,
          }
        );
      }
      return useMutation<Partial<InferType<T>>, InferType<T>>(entity, 'POST', schema);
    },

    useUpdate: (id: string) => {
      if (useGlobalState) {
        return useMutationWithGlobalState<Partial<InferType<T>>, InferType<T>>(
          entity,
          `${entity}/${id}`,
          'PUT',
          schema,
          {
            optimistic: globalConfig?.optimistic,
            invalidateRelated: globalConfig?.invalidateRelated,
          }
        );
      }
      return useMutation<Partial<InferType<T>>, InferType<T>>(`${entity}/${id}`, 'PUT', schema);
    },

    useDelete: (id: string) => {
      if (useGlobalState) {
        return useMutationWithGlobalState<void, void>(
          entity,
          `${entity}/${id}`,
          'DELETE',
          undefined,
          {
            invalidateRelated: globalConfig?.invalidateRelated,
          }
        );
      }
      return useMutation<void, void>(`${entity}/${id}`, 'DELETE');
    },
  };
}
