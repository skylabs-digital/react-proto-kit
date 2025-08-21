import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createEntitySchema,
  createTimestampedSchema,
  createCrudApi,
  createReadOnlyApi,
  createCustomApi,
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

  describe('createCrudApi', () => {
    it('should create full CRUD API', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createCrudApi('products', schema);

      expect(api.useList).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });

  describe('createReadOnlyApi', () => {
    it('should create read-only API with only list and byId', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createReadOnlyApi('analytics', schema);

      expect(api.useList).toBeDefined();
      expect(api.useById).toBeDefined();
      expect((api as any).useCreate).toBeUndefined();
      expect((api as any).useUpdate).toBeUndefined();
      expect((api as any).useDelete).toBeUndefined();
    });
  });

  describe('createCustomApi', () => {
    it('should create API with only specified operations', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createCustomApi('items', schema, ['list', 'create']);

      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useById).toBeUndefined();
      expect(api.useUpdate).toBeUndefined();
      expect(api.useDelete).toBeUndefined();
    });

    it('should create API with all operations when specified', () => {
      const schema = createEntitySchema({
        name: z.string(),
      });

      const api = createCustomApi('items', schema, ['list', 'byId', 'create', 'update', 'delete']);

      expect(api.useList).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });
});
