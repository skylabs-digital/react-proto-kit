import { z } from 'zod';
import {
  GeneratedCrudApi,
  DomainApiBuilder,
  DomainApiConfig,
  ExtractPathParams,
  ListParams,
  CompleteEntityType,
} from '../types';
import { useQuery } from '../hooks/useQuery';
import { useList } from '../hooks/useList';
import { useMutation } from '../hooks/useMutation';
import { useQueryWithGlobalState } from '../hooks/useQueryWithGlobalState';
import { useListWithGlobalState } from '../hooks/useListWithGlobalState';
import { useMutationWithGlobalState } from '../hooks/useMutationWithGlobalState';
import { globalInvalidationManager } from '../context/InvalidationManager';

// Type extraction utilities
export type ExtractEntityType<T> =
  T extends GeneratedCrudApi<infer U, any, any>
    ? U
    : T extends Pick<GeneratedCrudApi<infer U, any, any>, any>
      ? U
      : T extends z.ZodSchema<infer U>
        ? U & { id: string; createdAt: string; updatedAt: string }
        : never;

export type ExtractInputType<T> =
  T extends GeneratedCrudApi<any, infer U, any>
    ? U
    : T extends Pick<GeneratedCrudApi<any, infer U, any>, any>
      ? U
      : never;

// Extract entity name from path for global state management
function extractEntityName(path: string): string {
  const segments = path.replace(/^\//, '').split('/');
  return segments[0].replace(/:\w+/, '');
}

// Validate required path parameters
function validatePathParams<TPath extends string>(
  path: TPath,
  pathParams?: Record<string, string>
): void {
  const requiredParams = path.match(/:([^/]+)/g)?.map(p => p.slice(1)) || [];

  for (const param of requiredParams) {
    if (!pathParams?.[param]) {
      throw new Error(`Missing required path parameter: ${param}`);
    }
  }
}

// Build endpoint with dynamic params and query string
function buildEndpoint(
  path: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, any>,
  staticQueryParams?: Record<string, string | number | boolean>,
  id?: string
): string {
  let endpoint = path;

  // Replace path parameters
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value);
    });
  }

  // Add ID if provided
  if (id) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}${id}` : `${endpoint}/${id}`;
  }

  // Build query string
  const params = new URLSearchParams();

  // Add static query params
  if (staticQueryParams) {
    Object.entries(staticQueryParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }

  // Add dynamic query params
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

// Create input schema from entity schema
function createInputSchema<T extends z.ZodSchema>(entitySchema: T): z.ZodSchema {
  if (entitySchema instanceof z.ZodObject) {
    const shape = entitySchema.shape;
    const inputShape: Record<string, z.ZodSchema> = {};

    // Exclude auto-generated fields
    Object.entries(shape).forEach(([key, schema]) => {
      if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
        inputShape[key] = schema as z.ZodSchema;
      }
    });

    return z.object(inputShape);
  }

  return entitySchema;
}

// Create update schema with optional fields
function createUpdateSchema<T extends z.ZodSchema>(entitySchema: T): z.ZodSchema {
  if (entitySchema instanceof z.ZodObject) {
    const shape = entitySchema.shape;
    const updateShape: Record<string, z.ZodSchema> = {};

    // Exclude auto-generated fields and make others optional
    Object.entries(shape).forEach(([key, schema]) => {
      if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
        updateShape[key] = (schema as z.ZodSchema).optional().nullable();
      }
    });

    return z.object(updateShape);
  }

  return entitySchema;
}

// Builder implementation
class DomainApiBuilderImpl<
  TEntity,
  TInput,
  TPath extends string,
  TQueryParams = Record<string, any>,
> implements DomainApiBuilder<TEntity, TInput, TPath, TQueryParams>
{
  constructor(
    private path: TPath,
    private entitySchema: z.ZodSchema<TEntity>,
    private createSchema: z.ZodSchema<TInput>,
    private updateSchema: z.ZodSchema<Partial<TInput>>,
    private config: DomainApiConfig<TEntity, TInput, TQueryParams>,
    private pathParams?: ExtractPathParams<TPath>,
    private queryParams?: Partial<TQueryParams>
  ) {}

  withParams<TParams extends ExtractPathParams<TPath>>(
    params: TParams
  ): DomainApiBuilder<TEntity, TInput, TPath, TQueryParams> {
    return new DomainApiBuilderImpl(
      this.path,
      this.entitySchema,
      this.createSchema,
      this.updateSchema,
      this.config,
      params,
      this.queryParams
    );
  }

  withQuery<TQuery extends Partial<TQueryParams>>(
    query: TQuery
  ): DomainApiBuilder<TEntity, TInput, TPath, TQueryParams> {
    return new DomainApiBuilderImpl(
      this.path,
      this.entitySchema,
      this.createSchema,
      this.updateSchema,
      this.config,
      this.pathParams,
      { ...this.queryParams, ...query }
    );
  }

  useList(params?: ListParams & { queryParams?: Partial<TQueryParams> }) {
    validatePathParams(this.path, this.pathParams);
    const mergedQueryParams = { ...this.queryParams, ...params?.queryParams };
    const endpoint = buildEndpoint(
      this.path,
      this.pathParams,
      mergedQueryParams,
      this.config.queryParams?.static
    );

    const entityName = extractEntityName(this.path);

    if (this.config.globalState) {
      // Use the base endpoint (without query params) as entity key for nested resources to avoid cache conflicts
      const baseEndpoint = buildEndpoint(this.path, this.pathParams, {}, {});
      const entityKey =
        this.pathParams && Object.keys(this.pathParams).length > 0 ? baseEndpoint : entityName;
      return useListWithGlobalState<CompleteEntityType<TEntity>>(entityKey, params as ListParams);
    }
    return useList<CompleteEntityType<TEntity>>(endpoint, params as ListParams);
  }

  useQuery(id: string, options?: { queryParams?: Partial<TQueryParams> }) {
    validatePathParams(this.path, this.pathParams);
    const mergedQueryParams = { ...this.queryParams, ...options?.queryParams };
    const endpoint = buildEndpoint(
      this.path,
      this.pathParams,
      mergedQueryParams,
      this.config.queryParams?.static,
      id
    );

    const entityName = extractEntityName(this.path);

    if (this.config.globalState) {
      return useQueryWithGlobalState<CompleteEntityType<TEntity>>(entityName, endpoint, undefined, {
        cacheTime: this.config.cacheTime,
      });
    }
    return useQuery<CompleteEntityType<TEntity>>(endpoint);
  }

  useById(id: string | undefined | null, options?: { queryParams?: Partial<TQueryParams> }) {
    if (!id) {
      return useQuery<CompleteEntityType<TEntity>>(undefined);
    }
    return this.useQuery(id, options);
  }

  useCreate() {
    validatePathParams(this.path, this.pathParams);
    const endpoint = buildEndpoint(
      this.path,
      this.pathParams,
      this.queryParams,
      this.config.queryParams?.static
    );

    const entityName = extractEntityName(this.path);

    if (this.config.globalState) {
      // Use the full endpoint as entity key for nested resources to avoid cache conflicts
      const entityKey =
        this.pathParams && Object.keys(this.pathParams).length > 0 ? endpoint : entityName;
      return useMutationWithGlobalState<TInput, CompleteEntityType<TEntity>>(
        entityKey,
        endpoint,
        'POST',
        this.createSchema,
        {
          optimistic: this.config.optimistic,
          invalidateRelated: this.config.invalidateRelated,
          entitySchema: this.entitySchema, // Pass entitySchema for default value extraction
        }
      );
    }
    return useMutation<TInput, CompleteEntityType<TEntity>>(endpoint, 'POST', this.createSchema);
  }

  useUpdate(id?: string) {
    validatePathParams(this.path, this.pathParams);
    const endpoint = buildEndpoint(
      this.path,
      this.pathParams,
      this.queryParams,
      this.config.queryParams?.static,
      id
    );

    const entityName = extractEntityName(this.path);

    if (this.config.globalState) {
      // Use the full endpoint as entity key for nested resources to avoid cache conflicts
      const entityKey =
        this.pathParams && Object.keys(this.pathParams).length > 0 ? endpoint : entityName;
      return useMutationWithGlobalState<Partial<TInput>, CompleteEntityType<TEntity>>(
        entityKey,
        endpoint,
        'PUT',
        this.updateSchema,
        {
          invalidateRelated: this.config.invalidateRelated,
        }
      );
    }
    return useMutation<Partial<TInput>, CompleteEntityType<TEntity>>(
      endpoint,
      'PUT',
      this.updateSchema
    );
  }

  useDelete(id?: string) {
    validatePathParams(this.path, this.pathParams);
    const endpoint = buildEndpoint(
      this.path,
      this.pathParams,
      this.queryParams,
      this.config.queryParams?.static,
      id
    );

    const entityName = extractEntityName(this.path);

    if (this.config.globalState) {
      // Use the full endpoint as entity key for nested resources to avoid cache conflicts
      const entityKey =
        this.pathParams && Object.keys(this.pathParams).length > 0 ? endpoint : entityName;
      const mutation = useMutationWithGlobalState<void, void>(
        entityKey,
        endpoint,
        'DELETE',
        undefined,
        { invalidateRelated: this.config.invalidateRelated }
      );

      return {
        ...mutation,
        mutate: (input?: void, dynamicId?: string) => {
          const deleteEndpoint = dynamicId
            ? buildEndpoint(
                this.path,
                this.pathParams,
                this.queryParams,
                this.config.queryParams?.static,
                dynamicId
              )
            : endpoint;
          return mutation.mutate(input, deleteEndpoint);
        },
      };
    }

    const mutation = useMutation<void, void>(endpoint, 'DELETE');
    return {
      ...mutation,
      mutate: (input?: void, dynamicId?: string) => {
        const deleteEndpoint = dynamicId
          ? buildEndpoint(
              this.path,
              this.pathParams,
              this.queryParams,
              this.config.queryParams?.static,
              dynamicId
            )
          : endpoint;
        return mutation.mutate(input, deleteEndpoint);
      },
    };
  }
}

export function createDomainApi<
  TPath extends string,
  TEntity = any,
  TUpsert = any,
  TQueryParams = any,
>(
  path: TPath,
  configOrSchema: DomainApiConfig<TEntity, TUpsert, TQueryParams> | z.ZodSchema<TEntity>
): GeneratedCrudApi<TEntity, TUpsert, TPath, TQueryParams> {
  // Handle backward compatibility - if second param is a schema
  const isLegacyCall = 'entitySchema' in configOrSchema ? false : true;

  let config: DomainApiConfig<TEntity, TUpsert, TQueryParams>;
  if (isLegacyCall) {
    config = {
      entitySchema: configOrSchema as z.ZodSchema<TEntity>,
      globalState: false,
    };
  } else {
    config = configOrSchema as DomainApiConfig<TEntity, TUpsert, TQueryParams>;
  }

  const entityName = extractEntityName(path);

  // Create input schemas
  const createSchema = config.upsertSchema || createInputSchema(config.entitySchema);
  const updateSchema = config.upsertSchema || createUpdateSchema(config.entitySchema);

  // Setup invalidation rules if specified
  if (config.invalidateRelated) {
    globalInvalidationManager.addRule({
      entity: entityName,
      invalidates: config.invalidateRelated,
    });
  }

  // Schema registration will be handled automatically by the connector when needed

  return new DomainApiBuilderImpl(
    path,
    config.entitySchema,
    createSchema as any,
    updateSchema as any,
    config
  ) as GeneratedCrudApi<TEntity, TUpsert, TPath, TQueryParams>;
}
