import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

function setDeepValue<TObj extends Record<string, any>>(obj: TObj, path: string, value: any): TObj {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) {
    return obj;
  }

  const root: any = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  let cursor: any = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor?.[key];
    const nextObj: any = Array.isArray(next) ? [...next] : { ...(next ?? {}) };
    cursor[key] = nextObj;
    cursor = nextObj;
  }

  cursor[parts[parts.length - 1]] = value;
  return root;
}

function getSchemaForPath(schema: z.ZodTypeAny, path: string): z.ZodTypeAny | null {
  const parts = path.split('.').filter(Boolean);
  let current: any = schema;

  const unwrap = (s: any): any => {
    if (s && typeof s.unwrap === 'function') {
      return unwrap(s.unwrap());
    }
    if (s && typeof s.innerType === 'function') {
      return unwrap(s.innerType());
    }
    return s;
  };

  for (const part of parts) {
    current = unwrap(current);
    const shape = current?.shape;
    const next = shape?.[part];
    if (!next) {
      return null;
    }
    current = next;
  }

  return unwrap(current);
}

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
  dirty: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T | string, value: FormFieldValue) => void;
  handleInputChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    onSubmit: (data: T) => void | Promise<void>
  ) => (event?: React.FormEvent) => Promise<void>;
  reset: (initialValues?: Partial<T>) => void;
  loadData: (data: Partial<T>) => void;
  setFieldError: (field: keyof T | string, error: string) => void;
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

  const dirty = useMemo(() => {
    return isDirty;
  }, [isDirty]);

  const validateField = useCallback(
    (name: keyof T | string, value: any) => {
      const path = String(name);
      try {
        const fieldSchema = getSchemaForPath(schema as any, path);
        if (fieldSchema) {
          fieldSchema.parse(value);
        } else {
          const testValues = setDeepValue(values as any, path, value);
          schema.parse(testValues);
        }

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[path];

          if (Object.keys(newErrors).length === 0) {
            setGeneralError(prevGeneralError => {
              return prevGeneralError === 'Please fix the errors below' ? null : prevGeneralError;
            });
          }

          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const issueForPath = error.issues.find(issue => issue.path.join('.') === path);
          const fieldError = issueForPath?.message ?? error.issues[0]?.message ?? 'Invalid value';

          setErrors(prev => ({
            ...prev,
            [path]: fieldError,
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[path];
            return newErrors;
          });
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
    (name: keyof T | string, value: FormFieldValue) => {
      const path = String(name);
      setValues(prev => setDeepValue(prev as any, path, value));
      setIsDirty(true);

      if (validateOnChange) {
        validateField(path, value);
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

  const reset = useCallback((newInitialValues?: Partial<T>) => {
    const resetValues = newInitialValues || initialValues;
    setValues(resetValues);
    setErrors({});
    setGeneralError(null);
    setIsDirty(false);
  }, []);

  const loadData = useCallback((data: Partial<T>) => {
    setValues(data);
    setErrors({});
    setGeneralError(null);
    setIsDirty(false);
  }, []);

  const setFieldError = useCallback((field: keyof T | string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [String(field)]: error,
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
    dirty,
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
