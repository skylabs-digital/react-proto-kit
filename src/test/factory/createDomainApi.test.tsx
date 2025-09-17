/// <reference types="vitest/globals" />
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';

const testEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

const testUpsertSchema = z.object({
  name: z.string(),
  value: z.number(),
});

describe('createDomainApi', () => {
  describe('API creation', () => {
    it('should create API with optimistic updates enabled', () => {
      const api = createDomainApi('testEntities', testEntitySchema, testUpsertSchema, {
        optimistic: true,
      });

      expect(api).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });

    it('should create API without config', () => {
      const api = createDomainApi('testEntities', testEntitySchema, testUpsertSchema);

      expect(api).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });

  describe('Configuration options', () => {
    it('should respect cache time configuration', () => {
      const api = createDomainApi('testEntities', testEntitySchema, testUpsertSchema, {
        cacheTime: 5000,
      });

      expect(api).toBeDefined();
    });

    it('should work with query parameters', () => {
      const api = createDomainApi('testEntities', testEntitySchema, testUpsertSchema, {
        queryParams: {
          static: { include: 'all' },
          dynamic: ['filter', 'sort'],
        },
      });

      expect(api).toBeDefined();
    });
  });

  describe('Schema validation', () => {
    it('should work with complex schemas', () => {
      const complexEntitySchema = z.object({
        id: z.string(),
        name: z.string().min(1),
        value: z.number().positive(),
        tags: z.array(z.string()).optional(),
      });

      const complexUpsertSchema = z.object({
        name: z.string().min(1),
        value: z.number().positive(),
        tags: z.array(z.string()).optional(),
      });

      const api = createDomainApi('complexEntities', complexEntitySchema, complexUpsertSchema);

      expect(api).toBeDefined();
      expect(api.useById).toBeDefined();
      expect(api.useList).toBeDefined();
      expect(api.useCreate).toBeDefined();
      expect(api.useUpdate).toBeDefined();
      expect(api.useDelete).toBeDefined();
    });
  });
});
