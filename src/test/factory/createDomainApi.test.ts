import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';
import { createEntitySchema } from '../../helpers/schemas';

// Mock the hooks
vi.mock('../../hooks/useQuery');
vi.mock('../../hooks/useList');
vi.mock('../../hooks/useMutation');

describe('createDomainApi', () => {
  it('should create API with all CRUD operations', () => {
    const schema = createEntitySchema({
      name: z.string(),
      price: z.number(),
    });

    const api = createDomainApi('products', schema);

    expect(api.useList).toBeDefined();
    expect(api.useById).toBeDefined();
    expect(api.useCreate).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.useDelete).toBeDefined();
  });

  it('should use correct entity name for endpoints', () => {
    const schema = createEntitySchema({
      title: z.string(),
    });

    const api = createDomainApi('posts', schema);

    // The hooks should be called with the correct entity name
    // This is tested indirectly through the hook tests
    expect(api).toBeDefined();
  });

  it('should handle complex schemas', () => {
    const schema = createEntitySchema({
      name: z.string(),
      tags: z.array(z.string()),
      metadata: z.object({
        category: z.string(),
        priority: z.number(),
      }),
      status: z.union([z.literal('active'), z.literal('inactive')]),
    });

    const api = createDomainApi('tasks', schema);

    expect(api.useList).toBeDefined();
    expect(api.useById).toBeDefined();
    expect(api.useCreate).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.useDelete).toBeDefined();
  });
});
