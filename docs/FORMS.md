# Forms Guide

React Proto Kit provides powerful form utilities that integrate seamlessly with Zod schemas for validation and type safety. This guide covers everything you need to know about handling forms in your applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Form Hook API](#form-hook-api)
- [Validation Patterns](#validation-patterns)
- [Advanced Form Patterns](#advanced-form-patterns)
- [Integration with APIs](#integration-with-apis)
- [Custom Form Components](#custom-form-components)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)

## Quick Start

The `useFormData` hook provides complete form state management with automatic validation:

```tsx
import { useFormData, z } from '@skylabs-digital/react-proto-kit';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

function UserForm() {
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(
    userSchema,
    { name: '', email: '', age: 18 }
  );

  const onSubmit = handleSubmit(async (data) => {
    console.log('Valid data:', data); // Fully typed and validated
    // Handle form submission
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input
          name="name"
          value={values.name || ''}
          onChange={handleInputChange}
          placeholder="Full Name"
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <input
          name="email"
          type="email"
          value={values.email || ''}
          onChange={handleInputChange}
          placeholder="Email Address"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <input
          name="age"
          type="number"
          value={values.age || ''}
          onChange={handleInputChange}
          placeholder="Age"
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>
      
      <button type="submit">Submit</button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  );
}
```

## Form Hook API

### `useFormData(schema, initialValues, options?)`

The main form hook that provides complete form state management.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `schema` | `ZodSchema` | Zod schema for validation |
| `initialValues` | `Partial<T>` | Initial form values |
| `options?` | `FormOptions` | Additional configuration |

#### Options

```tsx
interface FormOptions {
  validateOnChange?: boolean;    // Validate on every change (default: true)
  validateOnBlur?: boolean;      // Validate on blur (default: false)
  resetOnSubmit?: boolean;       // Reset form after successful submit (default: false)
  transformValues?: (values: any) => any; // Transform values before validation
}
```

#### Return Value

```tsx
interface UseFormDataResult<T> {
  values: Partial<T>;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (e: React.FormEvent) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Record<keyof T, string>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
  validate: () => boolean;
}
```

## Validation Patterns

### Basic Validation

```tsx
const schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

### Conditional Validation

```tsx
const profileSchema = z.object({
  type: z.enum(['personal', 'business']),
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
}).refine((data) => {
  if (data.type === 'business') {
    return data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: "Company name is required for business accounts",
  path: ["companyName"],
}).refine((data) => {
  if (data.type === 'business') {
    return data.taxId && data.taxId.length > 0;
  }
  return true;
}, {
  message: "Tax ID is required for business accounts",
  path: ["taxId"],
});
```

### Async Validation

```tsx
const asyncSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
}).refine(async (data) => {
  // Check if username is available
  const response = await fetch(`/api/check-username/${data.username}`);
  const result = await response.json();
  return result.available;
}, {
  message: "Username is already taken",
  path: ["username"],
});

function AsyncForm() {
  const [isValidating, setIsValidating] = useState(false);
  
  const form = useFormData(asyncSchema, { username: '', email: '' });
  
  const handleAsyncValidation = async () => {
    setIsValidating(true);
    const isValid = await form.validate();
    setIsValidating(false);
    return isValid;
  };
  
  const onSubmit = form.handleSubmit(async (data) => {
    const isValid = await handleAsyncValidation();
    if (isValid) {
      // Submit form
    }
  });
  
  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isValidating}>
        {isValidating ? 'Validating...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Advanced Form Patterns

### Multi-Step Forms

```tsx
const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const step2Schema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number is required'),
});

const step3Schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const form = useFormData(fullSchema, {});
  
  const validateCurrentStep = () => {
    const schemas = [step1Schema, step2Schema, step3Schema];
    const currentSchema = schemas[currentStep - 1];
    
    try {
      currentSchema.parse(form.values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {});
        form.setErrors(errors);
      }
      return false;
    }
  };
  
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const onSubmit = form.handleSubmit(async (data) => {
    // Submit complete form
    console.log('Complete form data:', data);
  });
  
  return (
    <div>
      <div className="step-indicator">
        Step {currentStep} of 3
      </div>
      
      <form onSubmit={currentStep === 3 ? onSubmit : (e) => { e.preventDefault(); nextStep(); }}>
        {currentStep === 1 && (
          <Step1Fields form={form} />
        )}
        
        {currentStep === 2 && (
          <Step2Fields form={form} />
        )}
        
        {currentStep === 3 && (
          <Step3Fields form={form} />
        )}
        
        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep}>Previous</button>
          )}
          
          <button type="submit">
            {currentStep === 3 ? 'Submit' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Dynamic Form Fields

```tsx
const dynamicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contacts: z.array(z.object({
    type: z.enum(['email', 'phone']),
    value: z.string().min(1, 'Contact value is required'),
  })).min(1, 'At least one contact is required'),
});

function DynamicForm() {
  const form = useFormData(dynamicSchema, {
    name: '',
    contacts: [{ type: 'email', value: '' }]
  });
  
  const addContact = () => {
    const currentContacts = form.values.contacts || [];
    form.setFieldValue('contacts', [
      ...currentContacts,
      { type: 'email', value: '' }
    ]);
  };
  
  const removeContact = (index: number) => {
    const currentContacts = form.values.contacts || [];
    form.setFieldValue('contacts', currentContacts.filter((_, i) => i !== index));
  };
  
  const updateContact = (index: number, field: string, value: string) => {
    const currentContacts = form.values.contacts || [];
    const updatedContacts = currentContacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    form.setFieldValue('contacts', updatedContacts);
  };
  
  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <div>
        <input
          name="name"
          value={form.values.name || ''}
          onChange={form.handleInputChange}
          placeholder="Name"
        />
        {form.errors.name && <span className="error">{form.errors.name}</span>}
      </div>
      
      <div>
        <h3>Contacts</h3>
        {(form.values.contacts || []).map((contact, index) => (
          <div key={index} className="contact-row">
            <select
              value={contact.type}
              onChange={(e) => updateContact(index, 'type', e.target.value)}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            
            <input
              value={contact.value}
              onChange={(e) => updateContact(index, 'value', e.target.value)}
              placeholder={contact.type === 'email' ? 'Email address' : 'Phone number'}
            />
            
            <button type="button" onClick={() => removeContact(index)}>
              Remove
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addContact}>
          Add Contact
        </button>
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Integration with APIs

### Create Form

```tsx
function CreateUserForm() {
  const { mutate: createUser, loading } = userApi.useCreate();
  const form = useFormData(userUpsertSchema, { name: '', email: '' });
  
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createUser(data);
      form.reset();
      // Show success message
    } catch (error) {
      // Handle API errors
      if (error.status === 422) {
        // Validation errors from server
        form.setErrors(error.data.errors);
      }
    }
  });
  
  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={form.values.name || ''}
        onChange={form.handleInputChange}
        placeholder="Name"
      />
      {form.errors.name && <span className="error">{form.errors.name}</span>}
      
      <input
        name="email"
        value={form.values.email || ''}
        onChange={form.handleInputChange}
        placeholder="Email"
      />
      {form.errors.email && <span className="error">{form.errors.email}</span>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Edit Form

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const { data: user, loading: userLoading } = userApi.useQuery(userId);
  const { mutate: updateUser, loading: updateLoading } = userApi.useUpdate();
  
  const form = useFormData(userUpsertSchema, user || { name: '', email: '' });
  
  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.setValues(user);
    }
  }, [user]);
  
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateUser(userId, data);
      // Show success message
    } catch (error) {
      // Handle errors
    }
  });
  
  if (userLoading) return <div>Loading user...</div>;
  
  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={form.values.name || ''}
        onChange={form.handleInputChange}
        placeholder="Name"
      />
      {form.errors.name && <span className="error">{form.errors.name}</span>}
      
      <input
        name="email"
        value={form.values.email || ''}
        onChange={form.handleInputChange}
        placeholder="Email"
      />
      {form.errors.email && <span className="error">{form.errors.email}</span>}
      
      <button type="submit" disabled={updateLoading}>
        {updateLoading ? 'Updating...' : 'Update User'}
      </button>
    </form>
  );
}
```

## Custom Form Components

### Reusable Form Field

```tsx
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  form: UseFormDataResult<any>;
}

function FormField({ name, label, type = 'text', placeholder, required, form }: FormFieldProps) {
  const hasError = !!form.errors[name];
  const isTouched = form.touched[name];
  
  return (
    <div className={`form-field ${hasError && isTouched ? 'error' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={form.values[name] || ''}
        onChange={form.handleInputChange}
        placeholder={placeholder}
        className={hasError && isTouched ? 'error' : ''}
      />
      
      {hasError && isTouched && (
        <span className="error-message">{form.errors[name]}</span>
      )}
    </div>
  );
}

// Usage
function UserForm() {
  const form = useFormData(userSchema, { name: '', email: '', age: 18 });
  
  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <FormField name="name" label="Full Name" required form={form} />
      <FormField name="email" label="Email" type="email" required form={form} />
      <FormField name="age" label="Age" type="number" form={form} />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Select Component

```tsx
interface SelectFieldProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  form: UseFormDataResult<any>;
}

function SelectField({ name, label, options, form }: SelectFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      
      <select
        id={name}
        name={name}
        value={form.values[name] || ''}
        onChange={form.handleSelectChange}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {form.errors[name] && (
        <span className="error-message">{form.errors[name]}</span>
      )}
    </div>
  );
}
```

## Error Handling

### Client-Side Validation Errors

```tsx
function FormWithValidation() {
  const form = useFormData(userSchema, { name: '', email: '', age: 0 });
  
  const onSubmit = form.handleSubmit(async (data) => {
    // Additional custom validation
    if (data.age < 13) {
      form.setFieldError('age', 'Must be at least 13 years old');
      return;
    }
    
    // Submit form
    console.log('Valid data:', data);
  });
  
  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      
      {!form.isValid && (
        <div className="form-errors">
          <p>Please fix the following errors:</p>
          <ul>
            {Object.entries(form.errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <button type="submit" disabled={!form.isValid}>
        Submit
      </button>
    </form>
  );
}
```

### Server-Side Validation Errors

```tsx
function FormWithServerValidation() {
  const { mutate: createUser } = userApi.useCreate();
  const form = useFormData(userSchema, { name: '', email: '' });
  
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createUser(data);
      form.reset();
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        // Server validation errors
        const serverErrors = {};
        error.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        form.setErrors(serverErrors);
      } else {
        // Generic error
        form.setErrors({ _form: 'An unexpected error occurred' });
      }
    }
  });
  
  return (
    <form onSubmit={onSubmit}>
      {form.errors._form && (
        <div className="form-error">{form.errors._form}</div>
      )}
      
      {/* Form fields */}
    </form>
  );
}
```

## Performance Optimization

### Debounced Validation

```tsx
import { useDebouncedCallback } from 'use-debounce';

function OptimizedForm() {
  const form = useFormData(userSchema, { name: '', email: '' }, {
    validateOnChange: false // Disable automatic validation
  });
  
  const debouncedValidate = useDebouncedCallback(
    () => form.validate(),
    300 // 300ms delay
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.handleInputChange(e);
    debouncedValidate();
  };
  
  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <input
        name="name"
        value={form.values.name || ''}
        onChange={handleInputChange}
        placeholder="Name"
      />
      {form.errors.name && <span className="error">{form.errors.name}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Memoized Form Components

```tsx
const MemoizedFormField = memo(({ name, form, ...props }: FormFieldProps) => {
  return (
    <div className="form-field">
      <input
        name={name}
        value={form.values[name] || ''}
        onChange={form.handleInputChange}
        {...props}
      />
      {form.errors[name] && (
        <span className="error">{form.errors[name]}</span>
      )}
    </div>
  );
});

function OptimizedForm() {
  const form = useFormData(largeSchema, initialValues);
  
  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      {/* These components will only re-render when their specific field changes */}
      <MemoizedFormField name="field1" form={form} />
      <MemoizedFormField name="field2" form={form} />
      <MemoizedFormField name="field3" form={form} />
    </form>
  );
}
```

This forms guide provides comprehensive coverage of form handling patterns in React Proto Kit. The integration with Zod schemas ensures type safety and consistent validation across your application.
