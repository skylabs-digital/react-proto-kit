import { z } from 'zod';
import { createDomainApi, CompleteEntity } from '../factory/createDomainApi';
import { ErrorResponse, ListParams, PaginationMeta } from '../types';

// ReadOnlyApi interface for proper type inference
export interface ReadOnlyApi<TEntity> {
  useList: (params?: ListParams) => {
    data: CompleteEntity<TEntity>[] | null;
    loading: boolean;
    error: ErrorResponse | null;
    meta?: PaginationMeta;
    refetch: () => Promise<void>;
  };
  useById: (id: string | undefined | null) => {
    data: CompleteEntity<TEntity> | null;
    loading: boolean;
    error: ErrorResponse | null;
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
