import {
  ApiClientProvider,
  createEntitySchema,
  createCrudApi,
  createCreateSchema,
  createUpdateSchema,
  z,
} from '../index';

// 1. Define schema with complex validations
const UserSchema = createEntitySchema({
  email: z.email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  age: z.number().int().min(18, 'Must be at least 18 years old').max(120, 'Age must be realistic'),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone format')
    .optional(),
  role: z.enum(['admin', 'user', 'moderator']),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
    theme: z.enum(['light', 'dark']).default('light'),
  }),
  tags: z.array(z.string().min(1)).max(10, 'Maximum 10 tags allowed'),
});

// 2. Generate schemas with automatic validation
const UserCreateSchema = createCreateSchema(UserSchema);
const UserUpdateSchema = createUpdateSchema(UserSchema);

// 3. Create API with validation
const userApi = createCrudApi('users', UserSchema, {
  createSchema: UserCreateSchema,
  updateSchema: UserUpdateSchema,
});

// 4. Component with validation handling
function UserForm() {
  const createUser = userApi.useCreate!();
  const updateUser = userApi.useUpdate!('user-123');

  const handleCreateUser = async () => {
    try {
      // This will validate automatically before sending
      await createUser.mutate({
        email: 'user@example.com',
        name: 'John Doe',
        age: 25,
        phone: '+1-555-0123',
        role: 'user',
        preferences: {
          newsletter: true,
          notifications: false,
          theme: 'dark',
        },
        tags: ['developer', 'react'],
      });
      console.log('User created successfully!');
    } catch (error) {
      console.error('Validation failed:', error);
      // createUser.error will contain detailed validation errors
      if (createUser.error?.type === 'VALIDATION') {
        console.log('Validation errors:', createUser.error.validation);
        // Example output:
        // {
        //   "email": "Invalid email format",
        //   "age": "Must be at least 18 years old"
        // }
      }
    }
  };

  const handleInvalidUser = async () => {
    try {
      // This will fail validation
      await createUser.mutate({
        email: 'invalid-email', // Invalid email
        name: 'A', // Too short
        age: 15, // Too young
        role: 'invalid-role' as any, // Invalid role
        preferences: {
          newsletter: true,
          notifications: false,
          theme: 'purple' as any, // Invalid theme
        },
        tags: [], // Missing required data
      });
    } catch {
      console.error('Expected validation error:', createUser.error?.validation);
    }
  };

  const handleUpdateUser = async () => {
    try {
      // Partial updates are also validated
      await updateUser.mutate({
        name: 'Jane Doe',
        age: 30,
        preferences: {
          newsletter: false,
          notifications: true,
          theme: 'light',
        },
      });
      console.log('User updated successfully!');
    } catch (error) {
      console.error('Update validation failed:', error);
    }
  };

  return (
    <div>
      <h2>User Validation Example</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleCreateUser}
          disabled={createUser.loading}
          style={{ marginRight: '0.5rem' }}
        >
          {createUser.loading ? 'Creating...' : 'Create Valid User'}
        </button>

        <button
          onClick={handleInvalidUser}
          disabled={createUser.loading}
          style={{ marginRight: '0.5rem' }}
        >
          Create Invalid User (Test Validation)
        </button>

        <button onClick={handleUpdateUser} disabled={updateUser.loading}>
          {updateUser.loading ? 'Updating...' : 'Update User'}
        </button>
      </div>

      {/* Display validation errors */}
      {createUser.error?.type === 'VALIDATION' && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <h4>Validation Errors:</h4>
          <ul>
            {Object.entries(createUser.error.validation || {}).map(([field, message]) => (
              <li key={field}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {updateUser.error?.type === 'VALIDATION' && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            padding: '1rem',
            borderRadius: '4px',
          }}
        >
          <h4>Update Validation Errors:</h4>
          <ul>
            {Object.entries(updateUser.error.validation || {}).map(([field, message]) => (
              <li key={field}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// App with provider
export function ValidationExample() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <div>
        <h1>Validation Example with Zod</h1>
        <p>This example demonstrates automatic validation with detailed error messages.</p>
        <UserForm />
      </div>
    </ApiClientProvider>
  );
}
