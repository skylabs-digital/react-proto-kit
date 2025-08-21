import { z } from 'zod';
import { useFormData, UseFormDataOptions, UseFormDataReturn } from './useFormData';

export interface FormHandler<T> {
  useForm: (initialValues?: Partial<T>, options?: UseFormDataOptions) => UseFormDataReturn<T>;
  schema: z.ZodSchema<T>;
}

/**
 * Factory function to create a form handler with a specific schema
 * Follows the same pattern as createCrudApi for consistency
 */
export function createFormHandler<T extends Record<string, any>>(
  schema: z.ZodSchema<T>
): FormHandler<T> {
  return {
    schema,
    useForm: (initialValues?: Partial<T>, options?: UseFormDataOptions) => {
      return useFormData(schema, initialValues, options);
    },
  };
}
