import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormData } from '../../forms/useFormData';

// Test schema
const TestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
});

describe('useFormData', () => {
  describe('initialization', () => {
    it('should initialize with empty values by default', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      expect(result.current.values).toEqual({});
      expect(result.current.errors).toEqual({});
      expect(result.current.generalError).toBeNull();
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
    });

    it('should initialize with provided initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useFormData(TestSchema, initialValues));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('should update field value and mark as dirty', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      act(() => {
        result.current.handleChange('name', 'John Doe');
      });

      expect(result.current.values.name).toBe('John Doe');
      expect(result.current.isDirty).toBe(true);
    });

    it('should validate field on change by default', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      act(() => {
        result.current.handleChange('email', 'invalid-email');
      });

      expect(result.current.errors.email).toBe('Invalid email');
      expect(result.current.isValid).toBe(false);
    });

    it('should not validate on change when validateOnChange is false', () => {
      const { result } = renderHook(() => useFormData(TestSchema, {}, { validateOnChange: false }));

      act(() => {
        result.current.handleChange('email', 'invalid-email');
      });

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('handleInputChange', () => {
    it('should handle text input changes', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const mockEvent = {
        target: { name: 'name', type: 'text', value: 'John Doe' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.name).toBe('John Doe');
    });

    it('should handle checkbox input changes', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const mockEvent = {
        target: { name: 'isActive', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.isActive).toBe(true);
    });

    it('should handle number input changes', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const mockEvent = {
        target: { name: 'age', type: 'number', value: '25' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.age).toBe(25);
    });

    it('should handle empty number input', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const mockEvent = {
        target: { name: 'age', type: 'number', value: '' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.age).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate all fields correctly', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      act(() => {
        result.current.handleChange('name', '');
        result.current.handleChange('email', 'invalid');
        result.current.handleChange('age', 16);
      });

      act(() => {
        const isValid = result.current.validate();
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.name).toBe('Name is required');
      expect(result.current.errors.email).toBe('Invalid email');
      expect(result.current.errors.age).toBe('Must be at least 18');
      expect(result.current.generalError).toBe('Please fix the errors below');
    });

    it('should clear errors when validation passes', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      // Set all required fields first
      act(() => {
        result.current.handleChange('name', 'John');
        result.current.handleChange('age', 25);
        result.current.handleChange('isActive', true);
      });

      // Now set invalid email
      act(() => {
        result.current.handleChange('email', 'invalid');
      });

      expect(result.current.errors.email).toBe('Invalid email');

      // Then fix the email
      act(() => {
        result.current.handleChange('email', 'valid@example.com');
      });

      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit when validation passes', async () => {
      const { result } = renderHook(() => useFormData(TestSchema));
      const mockOnSubmit = vi.fn();

      // Set valid values
      act(() => {
        result.current.handleChange('name', 'John');
        result.current.handleChange('email', 'john@example.com');
        result.current.handleChange('age', 25);
        result.current.handleChange('isActive', true);
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        age: 25,
        isActive: true,
      });
    });

    it('should not call onSubmit when validation fails', async () => {
      const { result } = renderHook(() => useFormData(TestSchema));
      const mockOnSubmit = vi.fn();

      // Set invalid values
      act(() => {
        result.current.handleChange('email', 'invalid');
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(result.current.generalError).toBe('Please fix the errors below');
    });

    it('should handle async onSubmit errors', async () => {
      const { result } = renderHook(() => useFormData(TestSchema));
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));

      // Set valid values
      act(() => {
        result.current.handleChange('name', 'John');
        result.current.handleChange('email', 'john@example.com');
        result.current.handleChange('age', 25);
        result.current.handleChange('isActive', true);
      });

      const submitHandler = result.current.handleSubmit(mockOnSubmit);

      await act(async () => {
        await submitHandler();
      });

      expect(result.current.generalError).toBe('Submit failed');
    });
  });

  describe('utility methods', () => {
    it('should reset form to initial values', () => {
      const initialValues = { name: 'Initial' };
      const { result } = renderHook(() => useFormData(TestSchema, initialValues));

      // Change values and add errors
      act(() => {
        result.current.handleChange('name' as any, 'Changed');
        result.current.handleChange('email' as any, 'invalid');
      });

      expect(result.current.values.name).toBe('Changed');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.errors.email).toBe('Invalid email');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.generalError).toBeNull();
    });

    it('should reset form with new initial values', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const newValues = { name: 'New Name', email: 'new@example.com' };

      act(() => {
        result.current.reset(newValues);
      });

      expect(result.current.values).toEqual(newValues);
      expect(result.current.isDirty).toBe(false);
    });

    it('should load data without marking as dirty', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      const loadedData = { name: 'Loaded', email: 'loaded@example.com' };

      act(() => {
        result.current.loadData(loadedData);
      });

      expect(result.current.values).toEqual(loadedData);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.errors).toEqual({});
    });

    it('should set field error manually', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      act(() => {
        result.current.setFieldError('name', 'Custom error');
      });

      expect(result.current.errors.name).toBe('Custom error');
      expect(result.current.isValid).toBe(false);
    });

    it('should clear all errors', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      // Set some errors
      act(() => {
        result.current.handleChange('email', 'invalid');
        result.current.setFieldError('name', 'Custom error');
      });

      expect(Object.keys(result.current.errors)).toHaveLength(2);

      // Clear errors
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.generalError).toBeNull();
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('computed properties', () => {
    it('should calculate isValid correctly', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      // Initially valid because no validation has occurred yet
      expect(result.current.isValid).toBe(true);

      // Set an invalid email to trigger validation
      act(() => {
        result.current.handleChange('email', 'invalid');
      });

      expect(result.current.isValid).toBe(false);

      // Fix the email
      act(() => {
        result.current.handleChange('email', 'valid@example.com');
      });

      expect(result.current.isValid).toBe(true);

      // Add another error
      act(() => {
        result.current.setFieldError('name', 'Custom error');
      });

      expect(result.current.isValid).toBe(false);

      // Clear errors
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.isValid).toBe(true);
    });

    it('should track isDirty state correctly', () => {
      const { result } = renderHook(() => useFormData(TestSchema));

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.handleChange('name', 'Test');
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });
});
