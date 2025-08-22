# Guía de Uso

## 🚀 Inicio Rápido

### 1. Configurar Provider Global
```typescript
// main.tsx
import { ApiClientProvider } from '@skylabs-digital/react-proto-kit';
import { devConfig, prodConfig } from './config/api';

const config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

ReactDOM.render(
  <ApiClientProvider 
    connector={config.connector} 
    config={config.options}
  >
    <App />
  </ApiClientProvider>,
  document.getElementById('root')
);
```

### 2. Definir Esquemas en la App
```typescript
// schemas/user.schema.ts
import { Type } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.String(),
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 0, maximum: 120 })),
  createdAt: Type.String({ format: 'date-time' })
});

export const CreateUserSchema = Type.Omit(UserSchema, ['id', 'createdAt']);
export const UpdateUserSchema = Type.Partial(CreateUserSchema);
```

### 3. Generar API de Dominio con Factory
```typescript
// api/user.api.ts
import { createDomainApi } from '@skylabs-digital/react-proto-kit';
import { UserSchema, CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';

// Factory genérico - cada app define sus dominios
export const userApi = createDomainApi({
  entity: 'users',
  schema: UserSchema,
  createSchema: CreateUserSchema,    // Opcional - si no se pasa, no se genera useCreate
  updateSchema: UpdateUserSchema,    // Opcional - si no se pasa, no se genera useUpdate
  
  // Configuración específica del dominio
  pagination: { defaultLimit: 10 },
  interceptors: {
    request: (config, operation) => {
      if (operation === 'create') {
        config.headers['X-User-Creation'] = 'true';
      }
      return config;
    },
    error: (error, operation) => {
      if (error.code === 'USER_NOT_FOUND') {
        return { ...error, message: 'Usuario no encontrado' };
      }
    }
  }
});

// Hooks disponibles automáticamente:
// - userApi.useList()     -> GET /users (paginado)
// - userApi.useById(id)   -> GET /users/:id  
// - userApi.useCreate()   -> POST /users
// - userApi.useUpdate(id) -> PUT /users/:id
// - userApi.useDelete(id) -> DELETE /users/:id
```

### 4. Usar en Componentes React
```typescript
// components/UserList.tsx
import { userApi } from '../api/user.api';

function UserList() {
  // Hook de consulta (GET)
  const { data: users, loading, error, refetch } = userApi.useList({
    page: 1,
    limit: 10
  });
  
  // Hook de mutación (POST)
  const { mutate: createUser, loading: creating } = userApi.useCreate();

  const handleCreate = async (userData) => {
    try {
      const newUser = await createUser(userData);
      refetch(); // Actualizar lista
    } catch (err) {
      // Error ya manejado por el hook
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <CreateUserForm onSubmit={handleCreate} loading={creating} />
    </div>
  );
}
```

## 🔄 Configuración por Entorno

### Desarrollo con LocalStorage
```typescript
// config/api.ts
export const devConfig = {
  connector: 'localStorage' as const,
  options: {
    simulateDelay: 300,
    errorRate: 0.1, // 10% de errores simulados
    devMode: true
  }
};
```

### Testing con Mock API
```typescript
export const testConfig = {
  connector: 'fetch' as const,
  options: {
    baseUrl: 'http://localhost:3001/mock-api',
    timeout: 5000
  }
};
```

### Producción - Configuración Básica
```typescript
export const prodConfig = {
  connector: 'fetch' as const,
  options: {
    baseUrl: process.env.REACT_APP_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    retries: 3,
    timeout: 10000
  }
};
```

### Producción - Con Instancia Personalizada
```typescript
// Crear instancia personalizada con interceptors
const createCustomFetchInstance = (): FetchInstance => ({
  baseURL: process.env.REACT_APP_API_URL!,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
    'X-Client': 'my-react-app'
  },
  interceptors: {
    request: [
      // Interceptor de autenticación
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      // Interceptor de logging
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 API Request:', config.method, config.url, config.data);
        }
        return config;
      },
      // Interceptor de validación
      (config) => {
        // Validar que todas las requests tengan Content-Type
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      }
    ],
    response: [
      // Interceptor de manejo de errores
      (response) => {
        if (response.status === 401) {
          // Token expirado - redirect a login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return response;
      },
      // Interceptor de logging de respuestas
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📥 API Response:', response.status, response.url);
        }
        return response;
      },
      // Interceptor de validación de respuestas
      (response) => {
        // Validar que la respuesta tenga el formato esperado
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          // Respuesta válida
        }
        return response;
      }
    ]
  },
  timeout: 15000,
  retries: 3
});

export const prodConfigAdvanced = {
  connector: 'fetch' as const,
  options: {
    fetchInstance: createCustomFetchInstance()
  }
};
```

### Cambio Transparente
```typescript
// main.tsx - Solo cambiar una línea
const config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

<ApiClientProvider connector={config.connector} config={config.options}>
  <App /> {/* La app no cambia nada */}
</ApiClientProvider>
```

## 🎣 Hooks Disponibles

### Query Hooks (GET)
```typescript
// Obtener lista
const { data, loading, error, refetch } = useUsers({
  page: 1,
  limit: 10,
  filters: { active: true }
});

// Obtener por ID
const { data: user, loading, error } = useUser('123');
```

### Mutation Hooks (POST/PUT/DELETE)
```typescript
// Crear
const { mutate: createUser, loading, error } = useCreateUser({
  onSuccess: (user) => console.log('Usuario creado:', user),
  onError: (error) => console.error('Error:', error)
});

// Actualizar
const { mutate: updateUser } = useUpdateUser('123');

// Eliminar
const { mutate: deleteUser } = useDeleteUser();
```

## 🛡️ Manejo de Errores

### Errores por Tipo
```typescript
function handleApiError(error: ApiError) {
  switch (error.type) {
    case 'AUTH':
      // Redireccionar a login
      router.push('/login');
      break;
      
    case 'VALIDATION':
      // Mostrar errores de validación
      setFieldErrors(error.validation || {});
      break;
      
    case 'TRANSACTION':
      // Mostrar mensaje de error
      toast.error(error.message);
      break;
      
    case 'NAVIGATION':
      // Redireccionar a página de error
      router.push('/404');
      break;
  }
}
```

### Error Boundaries
```typescript
function ApiErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div>
          <h2>Error en la API</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 📊 Paginación

### Hook con Paginación
```typescript
function UserTable() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useUsers({ page, limit: 10 });

  return (
    <div>
      <table>
        {data?.data.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </table>
      
      <Pagination
        current={page}
        total={data?.meta?.totalPages || 0}
        onChange={setPage}
      />
    </div>
  );
}
```

## 🔧 Configuración Avanzada

### Interceptors Globales vs Por Dominio
```typescript
// main.tsx - Interceptors globales via fetchInstance
const globalFetchInstance: FetchInstance = {
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  interceptors: {
    request: [
      // Interceptor global de autenticación
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    ],
    response: [
      // Interceptor global de logging
      (response) => {
        console.log('Global API Response:', response.status);
        return response;
      }
    ]
  }
};

const prodConfig = {
  connector: 'fetch' as const,
  options: {
    fetchInstance: globalFetchInstance
  }
};

// Los interceptors por dominio se combinan con los globales
const userApi = createDomainApi({
  entity: 'users',
  schema: UserSchema,
  interceptors: {
    request: (config, operation) => {
      // Interceptor específico de usuarios (se ejecuta después del global)
      if (operation === 'create') {
        config.headers['X-User-Creation'] = 'true';
      }
      return config;
    }
  }
});
```

### Caching Global
```typescript
const prodConfig = {
  connector: 'fetch' as const,
  options: {
    baseUrl: '/api',
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutos
      strategy: 'stale-while-revalidate'
    }
  }
};
```

## 🧪 Testing

### Mock Provider para Tests
```typescript
// En tests
import { ApiClientProvider } from '@skylabs-digital/react-proto-kit';

const mockConfig = {
  connector: 'mock' as const,
  options: {
    data: {
      users: [
        { id: '1', name: 'Test User', email: 'test@example.com' }
      ]
    }
  }
};

test('should render user list', () => {
  render(
    <ApiClientProvider connector={mockConfig.connector} config={mockConfig.options}>
      <UserList />
    </ApiClientProvider>
  );
  expect(screen.getByText('Test User')).toBeInTheDocument();
});
```
