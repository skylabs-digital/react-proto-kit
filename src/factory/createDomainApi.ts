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

// Implementation
export function createDomainApi<TEntity extends z.ZodSchema, TUpsert extends z.ZodSchema>(
  entity: string,
  entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: GlobalStateConfig
) {
  type EntityType = CompleteEntityType<InferType<TEntity>>;

  return {
    useList: (params?: ListParams) => {
      return useList<EntityType>(entity, entity, params, {
        cacheTime: config?.cacheTime,
      });
    },

    useQuery: (id: string | undefined | null) => {
      return useQuery<EntityType>(entity, id ? `${entity}/${id}` : undefined, undefined, {
        cacheTime: config?.cacheTime,
      });
    },

    useById: (id: string | undefined | null) => {
      return useQuery<EntityType>(entity, id ? `${entity}/${id}` : undefined, undefined, {
        cacheTime: config?.cacheTime,
      });
    },

    useCreate: () => {
      return useCreateMutation<z.infer<TUpsert>, EntityType>(
        entity,
        upsertSchema as z.ZodSchema<z.infer<TUpsert>>,
        {
          optimistic: config?.optimistic,
          entitySchema: entitySchema as z.ZodSchema<any>,
        }
      );
    },

    useUpdate: () => {
      return useUpdateMutation<z.infer<TUpsert>, EntityType>(
        entity,
        upsertSchema as z.ZodSchema<z.infer<TUpsert>>
      );
    },

    usePatch: () => {
      return usePatchMutation<Partial<z.infer<TUpsert>>, EntityType>(entity);
    },

    useDelete: () => {
      return useDeleteMutation<EntityType>(entity);
    },
  };
}
