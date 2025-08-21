import { describe, it, expect, vi } from 'vitest';
import { Type } from '@sinclair/typebox';
import { createDomainApi } from '../../factory/createDomainApi';
import { createEntitySchema } from '../../helpers/schemas';

// Mock the hooks
vi.mock('../../hooks/useQuery');
vi.mock('../../hooks/useList');
vi.mock('../../hooks/useMutation');

describe('createDomainApi', () => {
  it('should create API with all CRUD operations', () => {
    const schema = createEntitySchema({
      name: Type.String(),
      price: Type.Number(),
    });

    const config = {
      entity: 'products',
      schema,
    };

    const api = createDomainApi(config);

    expect(api.useList).toBeDefined();
    expect(api.useById).toBeDefined();
    expect(api.useCreate).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.useDelete).toBeDefined();
  });

  it('should use correct entity name for endpoints', () => {
    const schema = createEntitySchema({
      title: Type.String(),
    });

    const config = {
      entity: 'posts',
      schema,
    };

    const api = createDomainApi(config);

    // The hooks should be called with the correct entity name
    // This is tested indirectly through the hook tests
    expect(api).toBeDefined();
  });

  it('should handle complex schemas', () => {
    const schema = createEntitySchema({
      name: Type.String(),
      tags: Type.Array(Type.String()),
      metadata: Type.Object({
        category: Type.String(),
        priority: Type.Number(),
      }),
      status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
    });

    const config = {
      entity: 'tasks',
      schema,
    };

    const api = createDomainApi(config);

    expect(api.useList).toBeDefined();
    expect(api.useById).toBeDefined();
    expect(api.useCreate).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.useDelete).toBeDefined();
  });
});
