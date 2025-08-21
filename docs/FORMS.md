# 📝 Forms Module Documentation

Complete guide to the Forms module in React Proto Kit - build type-safe forms with automatic validation.

## 🎯 **Quick Start**

```tsx
import { useFormData, createFormHandler } from '@skylabs-digital/react-proto-kit';
import { z } from 'zod';

// 1. Define your schema
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
  isActive: z.boolean(),
});

// 2. Use the form hook
function UserForm() {
  const { 
    values, 
    errors, 
    handleChange, 
    handleInputChange, 
    handleSubmit,
    isValid,
    isDirty 
  } = useFormData(UserSchema);

  const onSubmit = handleSubmit(async (data) => {
    console.log('Valid form data:', data);
    // Submit to API
  });

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="name" 
        value={values.name || ''} 
        onChange={handleInputChange} 
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <input 
        name="email" 
        type="email" 
        value={values.email || ''} 
        onChange={handleInputChange} 
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input 
        name="age" 
        type="number" 
        value={values.age || ''} 
        onChange={handleInputChange} 
      />
      {errors.age && <span className="error">{errors.age}</span>}
      
      <label>
        <input 
          name="isActive" 
          type="checkbox" 
          checked={values.isActive || false} 
          onChange={handleInputChange} 
        />
        Active user
      </label>
      
      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

## 🏭 **Factory Pattern**

For consistency with the API module, use the factory pattern:

```tsx
import { createFormHandler } from '@skylabs-digital/react-proto-kit';

// Create form handler
const userFormHandler = createFormHandler(UserSchema);

// Use in components
function UserForm() {
  const form = userFormHandler.useForm({
    // Initial values
    name: 'John Doe',
    email: 'john@example.com'
  });

  return (
    <form onSubmit={form.handleSubmit(async (data) => {
      await userApi.useCreate().mutate(data);
    })}>
      {/* Form fields */}
    </form>
  );
}

// Reuse across components
function EditUserForm({ user }) {
  const form = userFormHandler.useForm(user); // Pre-populate with existing data
  // ... rest of component
}
```

## 🎛️ **API Reference**

### `useFormData(schema, initialValues?, options?)`

Main hook for form handling.

**Parameters:**
- `schema: ZodSchema` - Zod validation schema
- `initialValues?: Partial<T>` - Initial form values
- `options?: UseFormDataOptions` - Configuration options

**Returns:**
```tsx
interface UseFormDataReturn<T> {
  values: Partial<T>;           // Current form values
  errors: FormErrors;           // Validation errors
  generalError: string | null;  // General form error
  isValid: boolean;             // Form validation state
  isDirty: boolean;             // Has form been modified
  
  // Event handlers
  handleChange: (name: keyof T, value: FormFieldValue) => void;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (event?: React.FormEvent) => Promise<void>;
  
  // Utility methods
  reset: (initialValues?: Partial<T>) => void;
  loadData: (data: Partial<T>) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
}
```

### `createFormHandler(schema)`

Factory function for creating reusable form handlers.

**Parameters:**
- `schema: ZodSchema` - Zod validation schema

**Returns:**
```tsx
interface FormHandler<T> {
  schema: ZodSchema<T>;
  useForm: (initialValues?: Partial<T>, options?: UseFormDataOptions) => UseFormDataReturn<T>;
}
```

### Options

```tsx
interface UseFormDataOptions {
  validateOnChange?: boolean;  // Validate on every change (default: true)
}
```

## 🎨 **Input Types & Handling**

The form module automatically handles different input types:

### Text Inputs
```tsx
<input 
  name="name" 
  type="text" 
  value={values.name || ''} 
  onChange={handleInputChange} 
/>
```

### Email Inputs
```tsx
<input 
  name="email" 
  type="email" 
  value={values.email || ''} 
  onChange={handleInputChange} 
/>
```

### Number Inputs
```tsx
<input 
  name="age" 
  type="number" 
  value={values.age || ''} 
  onChange={handleInputChange} 
/>
```

### Checkbox Inputs
```tsx
<input 
  name="isActive" 
  type="checkbox" 
  checked={values.isActive || false} 
  onChange={handleInputChange} 
/>
```

### Select Inputs
```tsx
<select 
  name="category" 
  value={values.category || ''} 
  onChange={handleInputChange}
>
  <option value="">Select category</option>
  <option value="electronics">Electronics</option>
  <option value="clothing">Clothing</option>
</select>
```

### Textarea
```tsx
<textarea 
  name="description" 
  value={values.description || ''} 
  onChange={handleInputChange} 
/>
```

## 🔧 **Advanced Usage**

### Manual Field Updates

```tsx
const form = useFormData(UserSchema);

// Update specific field
const updateName = (newName: string) => {
  form.handleChange('name', newName);
};

// Load external data
const loadUserData = (userData: User) => {
  form.loadData(userData);
};
```

### Custom Validation

```tsx
const form = useFormData(UserSchema);

// Add custom field error
const validateCustom = () => {
  if (form.values.name === 'admin') {
    form.setFieldError('name', 'Admin is not allowed as a name');
    return false;
  }
  return true;
};

// Manual validation
const isFormValid = form.validate();
```

### Form Reset

```tsx
const form = useFormData(UserSchema, initialValues);

// Reset to initial values
const resetForm = () => {
  form.reset();
};

// Reset with new values
const resetWithNewData = (newData: Partial<User>) => {
  form.reset(newData);
};
```

### Conditional Validation

```tsx
const form = useFormData(UserSchema, {}, {
  validateOnChange: false  // Only validate on submit
});

const onSubmit = form.handleSubmit(async (data) => {
  // Validation happens here
  await submitData(data);
});
```

## 🎯 **Integration with API Module**

Seamless integration with the API module:

```tsx
function UserCrudForm({ userId }: { userId?: string }) {
  const userApi = createCrudApi('users', UserSchema);
  const { data: user } = userApi.useById(userId);
  const createUser = userApi.useCreate();
  const updateUser = userApi.useUpdate();
  
  const form = useFormData(UserSchema, user);
  
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (userId) {
        await updateUser.mutate(userId, data);
      } else {
        await createUser.mutate(data);
      }
      form.reset(); // Clear form after success
    } catch (error) {
      form.setFieldError('general', 'Failed to save user');
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      {form.generalError && (
        <div className="error">{form.generalError}</div>
      )}
      <button type="submit" disabled={!form.isValid || createUser.loading}>
        {createUser.loading ? 'Saving...' : 'Save User'}
      </button>
    </form>
  );
}
```

## 🧪 **Testing Forms**

```tsx
import { renderHook, act } from '@testing-library/react';
import { useFormData } from '@skylabs-digital/react-proto-kit';

describe('UserForm', () => {
  it('should validate required fields', () => {
    const { result } = renderHook(() => useFormData(UserSchema));
    
    // Initially valid (no validation errors)
    expect(result.current.isValid).toBe(true);
    
    // Add invalid data
    act(() => {
      result.current.handleChange('email', 'invalid-email');
    });
    
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.email).toBe('Invalid email');
  });
  
  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useFormData(UserSchema));
    
    // Set valid data
    act(() => {
      result.current.handleChange('name', 'John Doe');
      result.current.handleChange('email', 'john@example.com');
      result.current.handleChange('age', 25);
      result.current.handleChange('isActive', true);
    });
    
    // Submit form
    const submitHandler = result.current.handleSubmit(onSubmit);
    await act(async () => {
      await submitHandler();
    });
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      isActive: true
    });
  });
});
```

## 🎨 **Styling Examples**

### Basic CSS Classes

```tsx
function StyledForm() {
  const form = useFormData(UserSchema);
  
  return (
    <form className="form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="form-field">
        <label className="form-label">Name</label>
        <input 
          className={`form-input ${form.errors.name ? 'form-input--error' : ''}`}
          name="name" 
          value={form.values.name || ''} 
          onChange={form.handleInputChange} 
        />
        {form.errors.name && (
          <span className="form-error">{form.errors.name}</span>
        )}
      </div>
      
      <button 
        className={`form-submit ${!form.isValid ? 'form-submit--disabled' : ''}`}
        type="submit" 
        disabled={!form.isValid}
      >
        Submit
      </button>
    </form>
  );
}
```

### With Tailwind CSS

```tsx
function TailwindForm() {
  const form = useFormData(UserSchema);
  
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input 
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            form.errors.name ? 'border-red-500' : ''
          }`}
          name="name" 
          value={form.values.name || ''} 
          onChange={form.handleInputChange} 
        />
        {form.errors.name && (
          <p className="mt-1 text-sm text-red-600">{form.errors.name}</p>
        )}
      </div>
      
      <button 
        className={`w-full rounded-md px-4 py-2 text-white ${
          form.isValid 
            ? 'bg-indigo-600 hover:bg-indigo-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        type="submit" 
        disabled={!form.isValid}
      >
        Submit
      </button>
    </form>
  );
}
```

## 🚀 **Best Practices**

### 1. Schema-First Design
Always define your schema first and use it consistently across API and forms:

```tsx
// ✅ Good: Single source of truth
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const userApi = createCrudApi('users', UserSchema);
const userForm = createFormHandler(UserSchema);
```

### 2. Error Handling
Always handle both field-level and form-level errors:

```tsx
// ✅ Good: Comprehensive error handling
const form = useFormData(UserSchema);

const onSubmit = form.handleSubmit(async (data) => {
  try {
    await userApi.useCreate().mutate(data);
  } catch (error) {
    if (error.type === 'VALIDATION') {
      // Handle validation errors
      Object.entries(error.validation).forEach(([field, message]) => {
        form.setFieldError(field, message);
      });
    } else {
      // Handle general errors
      form.setFieldError('general', 'Something went wrong');
    }
  }
});
```

### 3. Loading States
Show loading states during form submission:

```tsx
function UserForm() {
  const form = useFormData(UserSchema);
  const createUser = userApi.useCreate();
  
  return (
    <form onSubmit={form.handleSubmit(async (data) => {
      await createUser.mutate(data);
    })}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={!form.isValid || createUser.loading}
      >
        {createUser.loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### 4. Form State Management
Use the built-in state management features:

```tsx
function UserForm() {
  const form = useFormData(UserSchema);
  
  // Show unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.isDirty]);
  
  return (
    <form>
      {form.isDirty && (
        <div className="warning">You have unsaved changes</div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

## 🔗 **Related Documentation**

- [API Module](../README.md#api-module) - For API integration
- [Schemas](./SCHEMAS.md) - Advanced schema patterns
- [Testing](../README.md#testing) - Testing utilities
- [Examples](../src/examples/) - Complete form examples
