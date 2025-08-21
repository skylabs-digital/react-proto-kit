import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { createFormHandler } from '../../forms/createFormHandler';

// Test schema
const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(13, 'Must be at least 13 years old'),
  isSubscribed: z.boolean().default(false),
});

describe('createFormHandler', () => {
  describe('factory creation', () => {
    it('should create a form handler with the provided schema', () => {
      const userFormHandler = createFormHandler(UserSchema);

      expect(userFormHandler).toHaveProperty('schema');
      expect(userFormHandler).toHaveProperty('useForm');
      expect(userFormHandler.schema).toBe(UserSchema);
      expect(typeof userFormHandler.useForm).toBe('function');
    });

    it('should create different handlers for different schemas', () => {
      const ProductSchema = z.object({
        name: z.string(),
        price: z.number(),
      });

      const userHandler = createFormHandler(UserSchema);
      const productHandler = createFormHandler(ProductSchema);

      expect(userHandler.schema).toBe(UserSchema);
      expect(productHandler.schema).toBe(ProductSchema);
      expect(userHandler).not.toBe(productHandler);
    });
  });

  describe('useForm hook', () => {
    it('should return a working form hook', () => {
      const userFormHandler = createFormHandler(UserSchema);
      const { result } = renderHook(() => userFormHandler.useForm());

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('errors');
      expect(result.current).toHaveProperty('handleChange');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('isValid');
      expect(result.current).toHaveProperty('isDirty');
    });

    it('should accept initial values', () => {
      const userFormHandler = createFormHandler(UserSchema);
      const initialValues = { username: 'johndoe', email: 'john@example.com' };

      const { result } = renderHook(() => userFormHandler.useForm(initialValues));

      expect(result.current.values).toEqual(initialValues);
    });

    it('should accept options', () => {
      const userFormHandler = createFormHandler(UserSchema);
      const options = { validateOnChange: false };

      const { result } = renderHook(() => userFormHandler.useForm({}, options));

      // Test that validateOnChange: false works
      act(() => {
        result.current.handleChange('email', 'invalid-email');
      });

      // Should not have validation errors since validateOnChange is false
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('form functionality through handler', () => {
    it('should validate using the provided schema', () => {
      const userFormHandler = createFormHandler(UserSchema);
      const { result } = renderHook(() => userFormHandler.useForm());

      act(() => {
        result.current.handleChange('username', 'ab'); // Too short
        result.current.handleChange('email', 'invalid'); // Invalid email
        result.current.handleChange('age', 10); // Too young
      });

      expect(result.current.errors.username).toBe('Username must be at least 3 characters');
      expect(result.current.errors.email).toBe('Invalid email format');
      expect(result.current.errors.age).toBe('Must be at least 13 years old');
      expect(result.current.isValid).toBe(false);
    });

    it('should handle form submission with valid data', async () => {
      const userFormHandler = createFormHandler(UserSchema);
      const { result } = renderHook(() => userFormHandler.useForm());
      const mockOnSubmit = vi.fn();

      // Set valid values
      act(() => {
        result.current.handleChange('username', 'johndoe');
        result.current.handleChange('email', 'john@example.com');
        result.current.handleChange('age', 25);
        result.current.handleChange('isSubscribed', true);
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
        isSubscribed: true,
      });
    });

    it('should prevent submission with invalid data', async () => {
      const userFormHandler = createFormHandler(UserSchema);
      const { result } = renderHook(() => userFormHandler.useForm());
      const mockOnSubmit = vi.fn();

      // Set invalid values
      act(() => {
        result.current.handleChange('username', 'ab'); // Too short
        result.current.handleChange('email', 'invalid'); // Invalid
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(result.current.generalError).toBe('Please fix the errors below');
    });
  });

  describe('multiple instances', () => {
    it('should create independent form instances', () => {
      const userFormHandler = createFormHandler(UserSchema);

      const { result: result1 } = renderHook(() => userFormHandler.useForm());
      const { result: result2 } = renderHook(() => userFormHandler.useForm());

      // Change values in first instance
      act(() => {
        result1.current.handleChange('username', 'user1');
      });

      // Second instance should remain unchanged
      expect(result1.current.values.username).toBe('user1');
      expect(result2.current.values.username).toBeUndefined();
    });

    it('should maintain separate state for each instance', () => {
      const userFormHandler = createFormHandler(UserSchema);

      const { result: result1 } = renderHook(() =>
        userFormHandler.useForm({ username: 'initial1' })
      );
      const { result: result2 } = renderHook(() =>
        userFormHandler.useForm({ username: 'initial2' })
      );

      expect(result1.current.values.username).toBe('initial1');
      expect(result2.current.values.username).toBe('initial2');

      // Modify first instance
      act(() => {
        result1.current.handleChange('email', 'invalid');
      });

      // Only first instance should have errors
      expect(result1.current.errors.email).toBe('Invalid email format');
      expect(result2.current.errors.email).toBeUndefined();
    });
  });

  describe('schema validation consistency', () => {
    it('should use the same validation rules as direct useFormData', () => {
      const userFormHandler = createFormHandler(UserSchema);
      const { result: handlerResult } = renderHook(() => userFormHandler.useForm());

      // Test the same validation that would occur with direct useFormData
      act(() => {
        handlerResult.current.handleChange('username', 'ab');
        handlerResult.current.handleChange('email', 'not-an-email');
        handlerResult.current.handleChange('age', 5);
      });

      expect(handlerResult.current.errors.username).toBe('Username must be at least 3 characters');
      expect(handlerResult.current.errors.email).toBe('Invalid email format');
      expect(handlerResult.current.errors.age).toBe('Must be at least 13 years old');
    });
  });

  describe('complex schema handling', () => {
    it('should handle nested objects and arrays', () => {
      const ComplexSchema = z.object({
        profile: z.object({
          firstName: z.string().min(1, 'First name required'),
          lastName: z.string().min(1, 'Last name required'),
        }),
        tags: z.array(z.string()).min(1, 'At least one tag required'),
        settings: z.object({
          notifications: z.boolean(),
          theme: z.enum(['light', 'dark']),
        }),
      });

      const complexFormHandler = createFormHandler(ComplexSchema);
      const { result } = renderHook(() => complexFormHandler.useForm());

      act(() => {
        result.current.handleChange('profile', { firstName: '', lastName: 'Doe' } as any);
        result.current.handleChange('tags', []);
        result.current.handleChange('settings', {
          notifications: true,
          theme: 'invalid' as any,
        } as any);
      });

      // Should validate nested fields
      expect(result.current.isValid).toBe(false);
    });
  });
});
