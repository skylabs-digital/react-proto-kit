import { z } from 'zod';
import { createDomainApi, CompleteEntity } from '../factory/createDomainApi';
import { ListParams } from '../types';

// ReadOnlyApi interface for proper type inference
export interface ReadOnlyApi<TEntity> {
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
  withParams: (params: Record<string, string>) => ReadOnlyApi<TEntity>;
  withQuery: (queryParams: Record<string, any>) => ReadOnlyApi<TEntity>;
}

// Schema helpers for common patterns
export function createEntitySchema<T extends z.ZodRawShape>(properties: T) {
  return z.object({
    id: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    ...properties,
  });
}

// Helper to infer the complete entity type (with id, createdAt, updatedAt)
export type InferEntityType<T extends z.ZodRawShape> = z.infer<
  ReturnType<typeof createEntitySchema<T>>
>;

// Helper to create entity schema and get the complete type
export function createEntitySchemaWithType<T extends z.ZodRawShape>(properties: T) {
  const schema = createEntitySchema(properties);
  return {
    schema,
    type: {} as InferEntityType<T>,
  };
}

export function createTimestampedSchema<T extends z.ZodRawShape>(properties: T) {
  return z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    ...properties,
  });
}

// CRUD API factory - the main helper for maximum agility
// TODO: Update this helper to work with new createDomainApi signature
// export function createCrudApi<T extends z.ZodSchema>(
//   entity: string,
//   schema: T,

// Specialized API factories
// Read-only API factory - useful for analytics, logs, etc.
export function createReadOnlyApi<T extends z.ZodSchema>(
  entity: string,
  entitySchema: T
): ReadOnlyApi<z.infer<T>> {
  // For read-only, we use the same schema for both entity and upsert (even though upsert won't be used)
  const api = createDomainApi(entity, entitySchema, entitySchema);

  // Return only the read operations
  return {
    useList: api.useList,
    useById: api.useById,
    withParams: params => createReadOnlyApi(entity, entitySchema).withParams(params) as any,
    withQuery: queryParams => api.withQuery(queryParams) as ReadOnlyApi<z.infer<T>>,
  };
}

// // Write-only API (for data ingestion scenarios)
// export function createWriteOnlyApi<T extends z.ZodSchema>(
//   entity: string,
//   schema: T
// ): Pick<GeneratedCrudApi<InferType<T>>, 'useCreate' | 'useUpdate' | 'useDelete'> {
//   const api = createCrudApi(entity, schema);
//   return {
//     useCreate: api.useCreate,
//     useUpdate: api.useUpdate,
//     useDelete: api.useDelete,
//   };
// }

// export function createCustomApi<T extends z.ZodSchema>(
//   entity: string,
//   schema: T,
//   operations: ('list' | 'byId' | 'create' | 'update' | 'delete')[]
// ): Partial<GeneratedCrudApi<InferType<T>>> {
//   const api = createCrudApi(entity, schema);
//   const customApi: Partial<GeneratedCrudApi<InferType<T>>> = {};

//   if (operations.includes('list')) customApi.useList = api.useList;
//   if (operations.includes('byId')) customApi.useById = api.useById;
//   if (operations.includes('create')) customApi.useCreate = api.useCreate;
//   if (operations.includes('update')) customApi.useUpdate = api.useUpdate;
//   if (operations.includes('delete')) customApi.useDelete = api.useDelete;

//   return customApi;
// }

// Schema generation helpers
export function createCreateSchema<T extends z.ZodObject<any>>(entitySchema: T) {
  return entitySchema.omit({ id: true, createdAt: true, updatedAt: true });
}

export function createUpdateSchema<T extends z.ZodObject<any>>(entitySchema: T) {
  return entitySchema.omit({ id: true, createdAt: true, updatedAt: true }).partial();
}

// Type inference helpers for auto-generated schemas
export type InferCreateType<T extends z.ZodSchema> = Omit<
  z.infer<T>,
  'id' | 'createdAt' | 'updatedAt'
>;
export type InferUpdateType<T extends z.ZodSchema> = Partial<InferCreateType<T>>;
