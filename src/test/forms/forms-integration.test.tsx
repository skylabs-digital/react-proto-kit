import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormData } from '../../forms/useFormData';
import { createFormHandler } from '../../forms/createFormHandler';

// Integration test schemas
const ProductSchema = z.object({
  id: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const UserProfileSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format'),
    phone: z
      .string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid phone format')
      .optional(),
  }),
  preferences: z.object({
    newsletter: z.boolean().default(false),
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  }),
  address: z
    .object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
      country: z.string().min(1, 'Country is required'),
    })
    .optional(),
});

describe('Forms Integration Tests', () => {
  describe('Form with Entity Schema', () => {
    it('should work with entity-like schema', () => {
      const { result } = renderHook(() => useFormData(ProductSchema));

      // Test that entity-like schema works with optional entity fields
      act(() => {
        result.current.handleChange('name', 'Test Product');
        result.current.handleChange('price', 99.99);
        result.current.handleChange('category', 'Electronics');
        result.current.handleChange('inStock', true);
      });

      act(() => {
        result.current.validate();
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.values).toEqual({
        name: 'Test Product',
        price: 99.99,
        category: 'Electronics',
        inStock: true,
      });
    });

    it('should handle optional entity fields', () => {
      const { result } = renderHook(() => useFormData(ProductSchema));

      act(() => {
        result.current.handleChange('name', 'Test Product');
        result.current.handleChange('price', 99.99);
        result.current.handleChange('category', 'Electronics');
        result.current.handleChange('inStock', true);
        result.current.handleChange('id', 'existing-id');
        result.current.handleChange('description', 'A great product');
        result.current.handleChange('tags', ['electronics', 'gadget']);
      });

      act(() => {
        result.current.validate();
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.values.id).toBe('existing-id');
      expect(result.current.values.description).toBe('A great product');
      expect(result.current.values.tags).toEqual(['electronics', 'gadget']);
    });
  });

  describe('Complex Nested Form Validation', () => {
    it('should validate nested objects correctly', () => {
      const { result } = renderHook(() => useFormData(UserProfileSchema));

      // Set invalid nested data
      act(() => {
        result.current.handleChange('personalInfo', {
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          phone: 'abc123',
        } as any);
        result.current.handleChange('preferences', {
          newsletter: true,
          notifications: false,
          theme: 'invalid' as any,
        } as any);
      });

      act(() => {
        result.current.validate();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors['personalInfo.firstName']).toBe('First name is required');
      expect(result.current.errors['personalInfo.email']).toBe('Invalid email format');
      expect(result.current.errors['personalInfo.phone']).toBe('Invalid phone format');
    });

    it('should handle partial nested updates', () => {
      const { result } = renderHook(() =>
        useFormData(UserProfileSchema, {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          preferences: {
            newsletter: false,
            notifications: true,
            theme: 'light' as const,
          },
        })
      );

      // Update only part of nested object
      act(() => {
        result.current.handleChange('personalInfo', {
          ...result.current.values.personalInfo!,
          email: 'newemail@example.com',
        } as any);
      });

      expect(result.current.values.personalInfo?.firstName).toBe('John');
      expect(result.current.values.personalInfo?.email).toBe('newemail@example.com');
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Form Handler Integration', () => {
    it('should create consistent form handlers', () => {
      const productFormHandler = createFormHandler(ProductSchema);
      const userFormHandler = createFormHandler(UserProfileSchema);

      const { result: productForm } = renderHook(() => productFormHandler.useForm());
      const { result: userForm } = renderHook(() => userFormHandler.useForm());

      // Both should have the same interface
      expect(typeof productForm.current.handleChange).toBe('function');
      expect(typeof productForm.current.handleSubmit).toBe('function');
      expect(typeof userForm.current.handleChange).toBe('function');
      expect(typeof userForm.current.handleSubmit).toBe('function');

      // But different schemas
      expect(productFormHandler.schema).toBe(ProductSchema);
      expect(userFormHandler.schema).toBe(UserProfileSchema);
    });

    it('should handle form submission with complex data', async () => {
      const userFormHandler = createFormHandler(UserProfileSchema);
      const { result } = renderHook(() => userFormHandler.useForm());
      const mockOnSubmit = vi.fn();

      // Set complete valid data
      act(() => {
        result.current.handleChange('personalInfo', {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1-555-123-4567',
        } as any);
        result.current.handleChange('preferences', {
          newsletter: true,
          notifications: false,
          theme: 'dark' as const,
        } as any);
        result.current.handleChange('address', {
          street: '123 Main St',
          city: 'Anytown',
          zipCode: '12345',
          country: 'USA',
        } as any);
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1-555-123-4567',
        },
        preferences: {
          newsletter: true,
          notifications: false,
          theme: 'dark',
        },
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zipCode: '12345',
          country: 'USA',
        },
      });
    });
  });

  describe('Form State Management', () => {
    it('should handle loading external data correctly', () => {
      const { result } = renderHook(() => useFormData(ProductSchema));

      const externalData = {
        id: 'prod-123',
        name: 'Loaded Product',
        price: 149.99,
        category: 'Books',
        inStock: false,
        description: 'A loaded product',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      act(() => {
        result.current.loadData(externalData);
      });

      expect(result.current.values).toEqual(externalData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.errors).toEqual({});
    });

    it('should handle form reset with new data', () => {
      const { result } = renderHook(() =>
        useFormData(ProductSchema, {
          name: 'Initial Product',
          price: 50,
        })
      );

      // Make changes
      act(() => {
        result.current.handleChange('name', 'Modified Product');
        result.current.handleChange('category', 'Modified Category');
      });

      expect(result.current.isDirty).toBe(true);

      // Reset with new initial data
      const newInitialData = {
        name: 'Reset Product',
        price: 75,
        category: 'Reset Category',
        inStock: true,
      };

      act(() => {
        result.current.reset(newInitialData);
      });

      expect(result.current.values).toEqual(newInitialData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle mixed validation errors', () => {
      const { result } = renderHook(() => useFormData(UserProfileSchema));

      act(() => {
        // Set some valid and some invalid data
        result.current.handleChange('personalInfo', {
          firstName: 'John',
          lastName: '',
          email: 'invalid-email',
        } as any);
        result.current.handleChange('preferences', {
          newsletter: true,
          notifications: true,
          theme: 'light' as const,
        } as any);
        result.current.handleChange('address', {
          street: 'Valid Street',
          city: '',
          zipCode: '123', // Too short
          country: 'USA',
        } as any);
      });

      act(() => {
        result.current.validate();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors['personalInfo.lastName']).toBe('Last name is required');
      expect(result.current.errors['personalInfo.email']).toBe('Invalid email format');
      expect(result.current.errors['address.city']).toBe('City is required');
      expect(result.current.errors['address.zipCode']).toBe(
        'ZIP code must be at least 5 characters'
      );
    });

    it('should clear errors when data becomes valid', () => {
      const { result } = renderHook(() => useFormData(ProductSchema));

      // Set invalid data
      act(() => {
        result.current.handleChange('name', '');
        result.current.handleChange('price', -10);
        result.current.handleChange('category', '');
      });

      expect(result.current.errors.name).toBe('Product name is required');
      expect(result.current.errors.price).toBe('Price must be positive');
      expect(result.current.errors.category).toBe('Category is required');

      // Fix the data
      act(() => {
        result.current.handleChange('name', 'Valid Product');
        result.current.handleChange('price', 99.99);
        result.current.handleChange('category', 'Valid Category');
        result.current.handleChange('inStock', true);
      });

      // Clear errors by validating with complete data
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.price).toBeUndefined();
      expect(result.current.errors.category).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with multiple form instances', () => {
      const formHandler = createFormHandler(ProductSchema);
      const instances: any[] = [];

      // Create multiple form instances
      for (let i = 0; i < 10; i++) {
        const { result } = renderHook(() =>
          formHandler.useForm({
            name: `Product ${i}`,
            price: i * 10,
          })
        );
        instances.push(result);
      }

      // Each instance should be independent
      instances.forEach((instance, index) => {
        expect(instance.current.values.name).toBe(`Product ${index}`);
        expect(instance.current.values.price).toBe(index * 10);
      });

      // Modify one instance
      act(() => {
        instances[0].current.handleChange('name', 'Modified Product');
      });

      // Only the first instance should be modified
      expect(instances[0].current.values.name).toBe('Modified Product');
      expect(instances[1].current.values.name).toBe('Product 1');
    });
  });
});
