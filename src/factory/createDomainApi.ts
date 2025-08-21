import { z } from 'zod';
import { DomainApiConfig, GeneratedCrudApi, ListParams, InferType } from '../types';
import { useQuery } from '../hooks/useQuery';
import { useList } from '../hooks/useList';
import { useMutation } from '../hooks/useMutation';

export function createDomainApi<T extends z.ZodSchema>(
  config: DomainApiConfig<T>
): GeneratedCrudApi<InferType<T>> {
  const { entity, createSchema, updateSchema } = config;

  return {
    useList: (params?: ListParams) => {
      return useList<InferType<T>>(entity, params);
    },

    useById: (id: string) => {
      return useQuery<InferType<T>>(`${entity}/${id}`);
    },

    useCreate: () => {
      return useMutation<Partial<InferType<T>>, InferType<T>>(entity, 'POST', createSchema);
    },

    useUpdate: (id: string) => {
      return useMutation<Partial<InferType<T>>, InferType<T>>(
        `${entity}/${id}`,
        'PUT',
        updateSchema
      );
    },

    useDelete: (id: string) => {
      return useMutation<void, void>(`${entity}/${id}`, 'DELETE');
    },
  };
}
