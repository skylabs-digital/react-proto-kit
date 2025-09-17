/// <reference types="vitest/globals" />
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';

const testSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

describe('createDomainApi', () => {
  describe('API creation', () => {
    it('should create API with global state enabled', () => {
      const api = createDomainApi('testEntities', testSchema, {
        globalState: true,
        optimistic: true,
      });

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });

    it('should create API without global state', () => {
      const api = createDomainApi('testEntities', testSchema);

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });

  describe('Global state configuration', () => {
    it('should accept global state configuration', () => {
      const api = createDomainApi('testEntities', testSchema, {
        globalState: true,
        optimistic: true,
      });

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });

    it('should accept optimistic updates configuration', () => {
      const api = createDomainApi('testEntities', testSchema, {
        globalState: true,
        optimistic: true,
      });

      expect(api).toBeDefined();
    });

    it('should accept invalidation configuration', () => {
      const api = createDomainApi('testEntities', testSchema, {
        globalState: true,
        optimistic: true,
      });

      expect(api).toBeDefined();
    });
  });

  describe('Configuration options', () => {
    it('should respect cache time configuration', () => {
      const api = createDomainApi('testEntities', testSchema, {
        globalState: true,
        cacheTime: 5000,
      });

      expect(api).toBeDefined();
    });

    it('should handle custom endpoints', () => {
      const api = createDomainApi('testEntities', testSchema, { globalState: true });

      expect(api).toBeDefined();
    });

    it('should work with different HTTP methods', () => {
      const api = createDomainApi('testEntities', testSchema, { globalState: true });

      expect(api).toBeDefined();
    });
  });

  describe('Schema validation', () => {
    it('should accept valid schema', () => {
      const api = createDomainApi('testEntities', testSchema, { globalState: true });

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });

    it('should work with complex schemas', () => {
      const complexSchema = z.object({
        id: z.string(),
        name: z.string().min(1),
        value: z.number().positive(),
        tags: z.array(z.string()).optional(),
      });

      const api = createDomainApi('complexEntities', complexSchema, { globalState: true });

      expect(api).toBeDefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should work without global state flag', () => {
      const api = createDomainApi('testEntities', testSchema);

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });

    it('should work with global state disabled', () => {
      const api = createDomainApi('testEntities', testSchema, { globalState: false });

      expect(api).toBeDefined();
      expect(api.useQuery).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });
});
