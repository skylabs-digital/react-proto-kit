# Developer Experience & Agilidad

## 🚀 Gaps Identificados para Máxima Agilidad

### 1. **Convenciones por Defecto (Cero Configuración)**
```typescript
// Actualmente requiere configuración manual
const userApi = createDomainApi({
  entity: 'users',
  schema: UserSchema,
  createSchema: CreateUserSchema,
  updateSchema: UpdateUserSchema
});

// PROPUESTA: Convenciones automáticas
const userApi = createDomainApi('users', UserSchema);
// Auto-genera: CreateUserSchema = Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'>
// Auto-genera: UpdateUserSchema = Partial<CreateUserSchema>
```

### 2. **Helpers para Esquemas Comunes**
```typescript
// PROPUESTA: Helpers para patrones comunes
import { createEntitySchema, createTimestampedSchema } from '@skylabs-digital/react-proto-kit';

// Schema con timestamps automáticos
const UserSchema = createTimestampedSchema({
  id: Type.String(),
  name: Type.String(),
  email: Type.String({ format: 'email' })
});
// Auto-genera: createdAt, updatedAt

// Schema con metadatos comunes
const ProductSchema = createEntitySchema({
  name: Type.String(),
  price: Type.Number(),
  category: Type.String()
});
// Auto-genera: id, createdAt, updatedAt, isActive
```

### 3. **Generación Automática de Archivos (Opcional)**
```bash
# CLI tool opcional para generar boilerplate
npx @skylabs-digital/react-proto-kit generate user
# Genera:
# - schemas/user.schema.ts
# - api/user.api.ts
# - types/user.types.ts
```

### 4. **Convenciones de Naming Automáticas**
```typescript
// PROPUESTA: Naming automático basado en entity
const api = createDomainApi('users', UserSchema);
// Auto-genera nombres:
// - api.useUsers() (lista)
// - api.useUser(id) (por ID)
// - api.useCreateUser()
// - api.useUpdateUser(id)
// - api.useDeleteUser(id)

// Para entidades complejas
const api = createDomainApi('order-items', OrderItemSchema);
// Auto-genera:
// - api.useOrderItems()
// - api.useOrderItem(id)
// - api.useCreateOrderItem()
```

### 5. **Configuración Global Simplificada**
```typescript
// PROPUESTA: Configuración por entorno más simple
// config/api.ts
export const apiConfig = createApiConfig({
  development: 'localStorage',
  test: 'mock',
  production: {
    baseUrl: process.env.REACT_APP_API_URL,
    auth: 'bearer' // Auto-configura interceptor de auth
  }
});

// main.tsx
<ApiClientProvider config={apiConfig} />
```

### 6. **Validaciones Automáticas**
```typescript
// PROPUESTA: Validaciones automáticas en desarrollo
const userApi = createDomainApi('users', UserSchema, {
  devMode: true // Auto-valida requests/responses en desarrollo
});
```

### 7. **Tipos TypeScript Automáticos**
```typescript
// PROPUESTA: Tipos generados automáticamente
const userApi = createDomainApi('users', UserSchema);

// Auto-genera tipos:
type User = InferType<typeof UserSchema>;
type CreateUser = InferCreateType<typeof UserSchema>;
type UpdateUser = InferUpdateType<typeof UserSchema>;
type UserListResponse = InferListResponse<typeof UserSchema>;
```

### 8. **Hooks de Utilidad Comunes**
```typescript
// PROPUESTA: Hooks de utilidad incluidos
import { useApiStatus, useApiCache, useApiRetry } from '@skylabs-digital/react-proto-kit';

function MyComponent() {
  const { isOnline, hasErrors } = useApiStatus();
  const { clearCache } = useApiCache();
  const { retryFailed } = useApiRetry();
}
```

### 9. **Debugging y DevTools**
```typescript
// PROPUESTA: DevTools integradas
const userApi = createDomainApi('users', UserSchema, {
  devTools: true // Integra con Redux DevTools para debugging
});
```

### 10. **Templates para Casos Comunes**
```typescript
// PROPUESTA: Templates predefinidos
import { createCrudApi, createReadOnlyApi, createCustomApi } from '@skylabs-digital/react-proto-kit';

// CRUD completo (más común)
const userApi = createCrudApi('users', UserSchema);

// Solo lectura
const reportApi = createReadOnlyApi('reports', ReportSchema);

// Custom (casos especiales)
const authApi = createCustomApi('auth', {
  login: { method: 'POST', endpoint: '/login', inputSchema: LoginSchema },
  logout: { method: 'POST', endpoint: '/logout' }
});
```

## 🎯 Flujo Ideal para Agregar Nuevo Dominio

### Caso Común (90% de casos):
```typescript
// 1. Definir schema (único paso manual)
const ProductSchema = createEntitySchema({
  name: Type.String(),
  price: Type.Number(),
  category: Type.String()
});

// 2. Crear API (una línea)
const productApi = createCrudApi('products', ProductSchema);

// 3. Usar en componente (cero configuración)
const { data: products } = productApi.useProducts();
const { mutate: createProduct } = productApi.useCreateProduct();
```

### Caso Especial (10% de casos):
```typescript
// Solo cuando necesitas customización
const productApi = createDomainApi('products', ProductSchema, {
  customOperations: {
    featured: { method: 'GET', endpoint: '/featured' }
  },
  interceptors: {
    request: (config, operation) => {
      // Lógica específica
    }
  }
});
```

## 📋 Prioridades para Implementación

1. **Alta Prioridad**: Convenciones automáticas y helpers de esquemas
2. **Media Prioridad**: Templates (createCrudApi, createReadOnlyApi)
3. **Baja Prioridad**: CLI tools y DevTools
