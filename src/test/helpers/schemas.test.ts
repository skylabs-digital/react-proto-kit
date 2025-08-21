import { describe, it, expect } from 'vitest';
import { Type } from '@sinclair/typebox';
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
        name: Type.String(),
        price: Type.Number(),
      });

      expect(schema.properties).toHaveProperty('id');
      expect(schema.properties).toHaveProperty('createdAt');
      expect(schema.properties).toHaveProperty('updatedAt');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('price');
    });
  });

  describe('createTimestampedSchema', () => {
    it('should create schema with only timestamps', () => {
      const schema = createTimestampedSchema({
        title: Type.String(),
      });

      expect(schema.properties).toHaveProperty('createdAt');
      expect(schema.properties).toHaveProperty('updatedAt');
      expect(schema.properties).toHaveProperty('title');
      expect(schema.properties).not.toHaveProperty('id');
    });
  });

  describe('createCrudApi', () => {
    it('should create full CRUD API', () => {
      const schema = createEntitySchema({
        name: Type.String(),
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
        name: Type.String(),
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
        name: Type.String(),
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
        name: Type.String(),
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
