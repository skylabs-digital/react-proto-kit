import { TSchema } from '@sinclair/typebox';
import { DomainApiConfig, GeneratedCrudApi, ListParams, InferType } from '../types';
import { useQuery } from '../hooks/useQuery';
import { useList } from '../hooks/useList';
import { useMutation } from '../hooks/useMutation';

export function createDomainApi<T extends TSchema>(
  config: DomainApiConfig<T>
): GeneratedCrudApi<InferType<T>> {
  const { entity } = config;

  return {
    useList: (params?: ListParams) => {
      return useList<InferType<T>>(entity, params);
    },

    useById: (id: string) => {
      return useQuery<InferType<T>>(`${entity}/${id}`);
    },

    useCreate: () => {
      return useMutation<Partial<InferType<T>>, InferType<T>>(entity, 'POST');
    },

    useUpdate: (id: string) => {
      return useMutation<Partial<InferType<T>>, InferType<T>>(`${entity}/${id}`, 'PUT');
    },

    useDelete: (id: string) => {
      return useMutation<void, void>(`${entity}/${id}`, 'DELETE');
    },
  };
}
