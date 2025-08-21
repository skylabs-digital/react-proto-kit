import { Type, TSchema, Static } from '@sinclair/typebox';
import { createDomainApi } from '../factory/createDomainApi';
import { DomainApiConfig, GeneratedCrudApi, InferType } from '../types';

// Schema helpers for common patterns
export function createEntitySchema<T extends Record<string, TSchema>>(properties: T) {
  return Type.Object({
    id: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    ...properties,
  });
}

export function createTimestampedSchema<T extends Record<string, TSchema>>(properties: T) {
  return Type.Object({
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    ...properties,
  });
}

// CRUD API factory - the main helper for maximum agility
export function createCrudApi<T extends TSchema>(
  entity: string,
  schema: T,
  options?: Partial<DomainApiConfig<T>>
): GeneratedCrudApi<InferType<T>> {
  const config: DomainApiConfig<T> = {
    entity,
    schema,
    ...options,
  };

  return createDomainApi(config);
}

// Specialized API factories
export function createReadOnlyApi<T extends TSchema>(
  entity: string,
  schema: T
): Pick<GeneratedCrudApi<InferType<T>>, 'useList' | 'useById'> {
  const api = createCrudApi(entity, schema);
  return {
    useList: api.useList,
    useById: api.useById,
  };
}

export function createCustomApi<T extends TSchema>(
  entity: string,
  schema: T,
  operations: ('list' | 'byId' | 'create' | 'update' | 'delete')[]
): Partial<GeneratedCrudApi<InferType<T>>> {
  const api = createCrudApi(entity, schema);
  const customApi: Partial<GeneratedCrudApi<InferType<T>>> = {};

  if (operations.includes('list')) customApi.useList = api.useList;
  if (operations.includes('byId')) customApi.useById = api.useById;
  if (operations.includes('create')) customApi.useCreate = api.useCreate;
  if (operations.includes('update')) customApi.useUpdate = api.useUpdate;
  if (operations.includes('delete')) customApi.useDelete = api.useDelete;

  return customApi;
}

// Type inference helpers for auto-generated schemas
export type InferCreateType<T extends TSchema> = Omit<Static<T>, 'id' | 'createdAt' | 'updatedAt'>;
export type InferUpdateType<T extends TSchema> = Partial<InferCreateType<T>>;
