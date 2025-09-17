import { z } from 'zod';
import { createDomainApi } from '../factory/createDomainApi';
import { DomainApiConfig, GeneratedCrudApi, InferType } from '../types';

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
export function createCrudApi<T extends z.ZodSchema>(
  entity: string,
  schema: T,
  _options?: Partial<DomainApiConfig<InferType<T>, InferType<T>>>
): GeneratedCrudApi<InferType<T>, InferType<T>, string> {
  return createDomainApi(entity, schema) as GeneratedCrudApi<InferType<T>, InferType<T>, string>;
}

// Specialized API factories
export function createReadOnlyApi<T extends z.ZodSchema>(
  entity: string,
  schema: T
): Pick<GeneratedCrudApi<InferType<T>, InferType<T>, string>, 'useList' | 'useById'> {
  const api = createCrudApi(entity, schema);
  return {
    useList: api.useList,
    useById: api.useById,
  };
}

export function createCustomApi<T extends z.ZodSchema>(
  entity: string,
  schema: T,
  operations: ('list' | 'byId' | 'create' | 'update' | 'delete')[]
): Partial<GeneratedCrudApi<InferType<T>, InferType<T>, string>> {
  const api = createCrudApi(entity, schema);
  const customApi: Partial<GeneratedCrudApi<InferType<T>, InferType<T>, string>> = {};

  if (operations.includes('list')) customApi.useList = api.useList;
  if (operations.includes('byId')) customApi.useById = api.useById;
  if (operations.includes('create')) customApi.useCreate = api.useCreate;
  if (operations.includes('update')) customApi.useUpdate = api.useUpdate;
  if (operations.includes('delete')) customApi.useDelete = api.useDelete;

  return customApi;
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

// Helper to extract default values from a Zod schema
export function extractSchemaDefaults(schema: z.ZodSchema): Record<string, any> {
  const defaults: Record<string, any> = {};

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      let currentSchema = fieldSchema as z.ZodTypeAny;

      // Unwrap ZodDefault to get the default value
      if (currentSchema instanceof z.ZodDefault) {
        const defaultValue = currentSchema._def.defaultValue;
        defaults[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
      }
      // Handle ZodOptional with default
      else if (currentSchema instanceof z.ZodOptional) {
        const innerSchema = currentSchema._def.innerType;
        if (innerSchema instanceof z.ZodDefault) {
          const defaultValue = innerSchema._def.defaultValue;
          defaults[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        }
      }
    }
  }

  return defaults;
}

// Helper to apply schema defaults to an object
export function applySchemaDefaults<T>(data: Partial<T>, schema: z.ZodSchema): T {
  const defaults = extractSchemaDefaults(schema);
  return { ...defaults, ...data } as T;
}
