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

export function createDomainApi<T extends z.ZodSchema>(
  entity: string,
  businessSchema: T,
  globalConfig?: GlobalStateConfig
): GeneratedCrudApi<InferType<T>> {
  type EntityType = CompleteEntityType<InferType<T>>;

  // Use upsertSchema if provided, otherwise use businessSchema with omitted auto-generated fields
  const createUpdateSchema = globalConfig?.upsertSchema || businessSchema;

  return {
    useList: (params?: ListParams) => {
      return useList<EntityType>(entity, entity, params, {
        cacheTime: globalConfig?.cacheTime,
      });
    },

    useQuery: (id: string | undefined | null) => {
      return useQuery<EntityType>(entity, id ? `${entity}/${id}` : undefined, undefined, {
        cacheTime: globalConfig?.cacheTime,
      });
    },

    useById: (id: string | undefined | null) => {
      return useQuery<EntityType>(entity, id ? `${entity}/${id}` : undefined, undefined, {
        cacheTime: globalConfig?.cacheTime,
      });
    },

    useCreate: () => {
      return useCreateMutation<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>, EntityType>(
        entity,
        createUpdateSchema as z.ZodSchema<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>>,
        {
          optimistic: globalConfig?.optimistic,
        }
      );
    },

    useUpdate: () => {
      return useUpdateMutation<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>, EntityType>(
        entity,
        createUpdateSchema as z.ZodSchema<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>>
      );
    },

    usePatch: () => {
      return usePatchMutation<
        Partial<Omit<InferType<T>, 'id' | 'createdAt' | 'updatedAt'>>,
        EntityType
      >(entity);
    },
    useDelete: () => {
      return useDeleteMutation<EntityType>(entity);
    },
  };
}
