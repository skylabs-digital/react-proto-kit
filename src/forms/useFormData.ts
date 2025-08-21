import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export type FormFieldValue = string | number | boolean | Date | string[] | null;

export interface FormErrors {
  [fieldName: string]: string;
}

export interface UseFormDataOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormDataReturn<T> {
  values: Partial<T>;
  errors: FormErrors;
  generalError: string | null;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: FormFieldValue) => void;
  handleInputChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    onSubmit: (data: T) => void | Promise<void>
  ) => (event?: React.FormEvent) => Promise<void>;
  reset: (initialValues?: Partial<T>) => void;
  loadData: (data: Partial<T>) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
}

export function useFormData<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {},
  options: UseFormDataOptions = {}
): UseFormDataReturn<T> {
  const { validateOnChange = true } = options;

  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && !generalError;
  }, [errors, generalError]);

  const validateField = useCallback(
    (name: keyof T, value: any) => {
      try {
        // For individual field validation, we'll validate just this field
        // by creating a partial schema for this field only
        const fieldSchema = (schema as any).shape?.[name as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
        } else {
          // Fallback: validate the entire object and check for this field's errors
          const testValues = { ...values, [name]: value };
          schema.parse(testValues);
        }

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.issues[0]?.message || 'Invalid value';

          setErrors(prev => ({
            ...prev,
            [name as string]: fieldError,
          }));
        }
        return false;
      }
    },
    [schema, values]
  );

  const validateAll = useCallback(() => {
    try {
      schema.parse(values);
      setErrors({});
      setGeneralError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.issues.forEach((err: z.ZodIssue) => {
          const fieldName = err.path.join('.');
          fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        setGeneralError('Please fix the errors below');
      }
      return false;
    }
  }, [schema, values]);

  const handleChange = useCallback(
    (name: keyof T, value: FormFieldValue) => {
      setValues(prev => ({ ...prev, [name]: value }));
      setIsDirty(true);

      if (validateOnChange) {
        validateField(name, value);
      }
    },
    [validateOnChange, validateField]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, type, value } = event.target;

      let processedValue: FormFieldValue = value;

      // Handle different input types
      if (type === 'checkbox') {
        processedValue = (event.target as HTMLInputElement).checked;
      } else if (type === 'number') {
        processedValue = value === '' ? null : Number(value);
      } else if (type === 'date') {
        processedValue = value === '' ? null : new Date(value);
      } else if (type === 'select-multiple') {
        const select = event.target as HTMLSelectElement;
        processedValue = Array.from(select.selectedOptions).map(option => option.value);
      }

      handleChange(name as keyof T, processedValue);
    },
    [handleChange]
  );

  const handleSubmit = useCallback(
    (onSubmit: (data: T) => void | Promise<void>) => {
      return async (event?: React.FormEvent) => {
        if (event) {
          event.preventDefault();
        }

        setGeneralError(null);

        if (validateAll()) {
          try {
            await onSubmit(values as T);
          } catch (error) {
            setGeneralError(error instanceof Error ? error.message : 'An error occurred');
          }
        }
      };
    },
    [values, validateAll]
  );

  const reset = useCallback(
    (newInitialValues?: Partial<T>) => {
      const resetValues = newInitialValues || initialValues;
      setValues(resetValues);
      setErrors({});
      setGeneralError(null);
      setIsDirty(false);
    },
    [initialValues]
  );

  const loadData = useCallback((data: Partial<T>) => {
    setValues(data);
    setErrors({});
    setGeneralError(null);
    setIsDirty(false);
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setGeneralError(null);
  }, []);

  const validate = useCallback(() => {
    return validateAll();
  }, [validateAll]);

  return {
    values,
    errors,
    generalError,
    isValid,
    isDirty,
    handleChange,
    handleInputChange,
    handleSubmit,
    reset,
    loadData,
    setFieldError,
    clearErrors,
    validate,
  };
}
