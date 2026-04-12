import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createEntitySchema,
  createTimestampedSchema,
  createReadOnlyApi,
  // createCrudApi, // TODO: Update for new createDomainApi signature
  // createCustomApi, // TODO: Update for new createDomainApi signature
} from '../../helpers/schemas';

describe('Schema Helpers', () => {
  describe('createEntitySchema', () => {
    it('should create schema with id and timestamps', () => {
      const schema = createEntitySchema({
        name: z.string(),
        price: z.number(),
      });

      expect(schema.shape).toHaveProperty('id');
      expect(schema.shape).toHaveProperty('createdAt');
      expect(schema.shape).toHaveProperty('updatedAt');
      expect(schema.shape).toHaveProperty('name');
      expect(schema.shape).toHaveProperty('price');
    });

    it('should validate entity data correctly', () => {
      const schema = createEntitySchema({
        name: z.string(),
        price: z.number(),
      });

      const validData = {
        id: '123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        name: 'Test Product',
        price: 99.99,
      };

      expect(() => schema.parse(validData)).not.toThrow();
    });
  });

  describe('createTimestampedSchema', () => {
    it('should create schema with only timestamps', () => {
      const schema = createTimestampedSchema({
        title: z.string(),
      });

      expect(schema.shape).toHaveProperty('createdAt');
      expect(schema.shape).toHaveProperty('updatedAt');
      expect(schema.shape).toHaveProperty('title');
      expect(schema.shape).not.toHaveProperty('id');
    });
  });

  describe('createReadOnlyApi', () => {
    it('should create read-only API with only read operations', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createReadOnlyApi('analytics', schema);

      expect(api.useList).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.withParams).toBeDefined();
      expect(api.withQuery).toBeDefined();
      // Should not have write operations
      expect((api as any).useCreate).toBeUndefined();
      expect((api as any).useUpdate).toBeUndefined();
      expect((api as any).useDelete).toBeUndefined();
      expect((api as any).usePatch).toBeUndefined();
    });

    it('should not stack overflow when calling withParams on a path with params', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createReadOnlyApi('zones:zoneId/items', schema);

      // This would cause a stack overflow before the fix
      const resolved = api.withParams({ zoneId: 'abc' });

      expect(resolved).toBeDefined();
      expect(resolved.useList).toBeDefined();
      expect(resolved.useById).toBeDefined();
      expect(resolved.withParams).toBeDefined();
      expect(resolved.withQuery).toBeDefined();
    });

    it('should allow chaining withParams and withQuery', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createReadOnlyApi('zones:zoneId/items', schema);

      const resolved = api.withParams({ zoneId: 'abc' }).withQuery({ filter: 'active' });

      expect(resolved).toBeDefined();
      expect(resolved.useList).toBeDefined();
    });
  });

  // TODO: Uncomment and update these tests when helper functions are updated for new createDomainApi signature
  // describe('createCrudApi', () => {
  //   it('should create full CRUD API', () => {
  //     const schema = createEntitySchema({
  //       name: z.string(),
  //     });

  //     const api = createCrudApi('products', schema);

  //     expect(api.useList).toBeDefined();
  //     expect(api.useById).toBeDefined();
  //     expect(api.useCreate).toBeDefined();
  //     expect(api.useUpdate).toBeDefined();
  //     expect(api.useDelete).toBeDefined();
  //   });
  // });

  // describe('createReadOnlyApi', () => {
  //   it('should create read-only API with only list and byId', () => {
  //     const schema = createEntitySchema({
  //       name: z.string(),
  //     });

  //     const api = createReadOnlyApi('analytics', schema);

  //     expect(api.useList).toBeDefined();
  //     expect(api.useById).toBeDefined();
  //     expect(api.useCreate).toBeUndefined();
  //     expect(api.useUpdate).toBeUndefined();
  //     expect(api.useDelete).toBeUndefined();
  //   });
  // });

  // describe('createCustomApi', () => {
  //   it('should create API with only specified operations', () => {
  //     const schema = createEntitySchema({
  //       name: z.string(),
  //     });

  //     const api = createCustomApi('logs', schema, ['list', 'create']);

  //     expect(api.useList).toBeDefined();
  //     expect(api.useCreate).toBeDefined();
  //     expect(api.useById).toBeUndefined();
  //     expect(api.useUpdate).toBeUndefined();
  //     expect(api.useDelete).toBeUndefined();
  //   });

  //   it('should handle empty operations array', () => {
  //     const schema = createEntitySchema({
  //       name: z.string(),
  //     });

  //     const api = createCustomApi('empty', schema, []);

  //     expect(api.useList).toBeUndefined();
  //     expect(api.useById).toBeUndefined();
  //     expect(api.useCreate).toBeUndefined();
  //     expect(api.useUpdate).toBeUndefined();
  //     expect(api.useDelete).toBeUndefined();
  //   });
  // });
});
