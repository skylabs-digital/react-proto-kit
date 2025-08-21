# Esquemas y Patrones de Respuesta

## 🛠️ Utilidades de Respuesta del Servidor

### Funciones Base (Referencia del servidor actual)
```typescript
// Respuesta exitosa simple
export const successResponse = <T>(data: T, message?: string): ResponseEnvelope<T> => {
  return {
    success: true,
    message: message ?? 'Success',
    data,
  };
};

// Respuesta de error
export const errorResponse = (code: string, message: string): ErrorResponse => {
  return {
    success: false,
    message,
    error: { code },
  };
};

// Respuesta con paginación
export const paginationResponse = <T>(
  data: T[] = [],
  meta: { total: number; page: number; limit: number },
  message?: string
): ResponseEnvelope<T[]> => {
  const { total = 0, page = 1, limit = 100 } = meta;
  return {
    success: true,
    message: message ?? 'Success',
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
```

## 📋 Esquemas Base

### Error Response Schema
```typescript
import { Type, TSchema } from '@sinclair/typebox';

export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Optional(
    Type.Object({
      code: Type.String(),
    })
  ),
  message: Type.Optional(Type.String()),
  type: Type.Optional(
    Type.Enum({
      AUTH: 'AUTH',
      VALIDATION: 'VALIDATION',
      TRANSACTION: 'TRANSACTION',
      NAVIGATION: 'NAVIGATION',
    })
  ),
  validation: Type.Optional(Type.Record(Type.String(), Type.String())),
});
```

### Response Envelope Schema
```typescript
export const ResponseEnvelopeSchema = <T extends TSchema>(schema?: T) =>
  schema
    ? Type.Object({
        success: Type.Literal(true),
        message: Type.Optional(Type.String()),
        data: schema,
        meta: Type.Optional(
          Type.Object({
            total: Type.Number({ default: 0 }),
            page: Type.Number({ default: 1 }),
            limit: Type.Number({ default: 100 }),
            totalPages: Type.Number({ default: 1 }),
          })
        ),
      })
    : Type.Object({
        success: Type.Literal(true),
        message: Type.Optional(Type.String()),
        meta: Type.Optional(
          Type.Object({
            total: Type.Number({ default: 0 }),
            page: Type.Number({ default: 1 }),
            limit: Type.Number({ default: 100 }),
            totalPages: Type.Number({ default: 1 }),
          })
        ),
      });
```

## 🎯 Tipos de Error Estandarizados

### AUTH (Autenticación)
- **Código**: `UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_EXPIRED`
- **Uso**: Errores de autenticación y autorización
- **Manejo**: Redirección a login, refresh token

### VALIDATION (Validación)
- **Código**: `INVALID_INPUT`, `MISSING_FIELD`, `FORMAT_ERROR`
- **Uso**: Errores de validación de formularios
- **Manejo**: Mostrar errores en campos específicos

### TRANSACTION (Transacción)
- **Código**: `CONFLICT`, `RESOURCE_NOT_FOUND`, `BUSINESS_RULE`
- **Uso**: Errores de lógica de negocio
- **Manejo**: Mensajes informativos al usuario

### NAVIGATION (Navegación)
- **Código**: `NOT_FOUND`, `ACCESS_DENIED`, `ROUTE_ERROR`
- **Uso**: Errores de navegación y rutas
- **Manejo**: Redirección a páginas de error

## 📊 Metadatos de Paginación

### Estructura Meta
```typescript
interface PaginationMeta {
  total: number;      // Total de elementos
  page: number;       // Página actual (1-indexed)
  limit: number;      // Elementos por página
  totalPages: number; // Total de páginas
}
```

### Cálculos Automáticos
- `totalPages = Math.ceil(total / limit)`
- Validación de rangos de página
- Navegación siguiente/anterior

## 🔄 Ejemplos de Uso

### Respuesta Exitosa con Datos
```json
// successResponse(user, "Usuario creado exitosamente")
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "123",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

### Respuesta Exitosa con Paginación
```json
// paginationResponse(users, { total: 150, page: 1, limit: 10 })
{
  "success": true,
  "message": "Success",
  "data": [
    { "id": "1", "name": "Usuario 1" },
    { "id": "2", "name": "Usuario 2" }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

### Respuesta de Error Simple
```json
// errorResponse("INVALID_INPUT", "Datos inválidos")
{
  "success": false,
  "message": "Datos inválidos",
  "error": { "code": "INVALID_INPUT" }
}
```

### Respuesta de Error con Validación (Extendida)
```json
{
  "success": false,
  "message": "Datos inválidos",
  "type": "VALIDATION",
  "error": { "code": "INVALID_INPUT" },
  "validation": {
    "email": "Formato de email inválido",
    "password": "Debe tener al menos 8 caracteres"
  }
}
```

### Respuesta de Error de Autenticación
```json
// errorResponse("TOKEN_EXPIRED", "Token expirado") + type: "AUTH"
{
  "success": false,
  "message": "Token expirado",
  "type": "AUTH",
  "error": { "code": "TOKEN_EXPIRED" }
}
```

## 🛠️ Generación de Tipos TypeScript

### Tipos Derivados
```typescript
// Generado automáticamente desde schemas
type UserResponse = Static<typeof ResponseEnvelopeSchema<typeof UserSchema>>;
type UserListResponse = Static<typeof ResponseEnvelopeSchema<typeof Type.Array(UserSchema)>>;
type ApiError = Static<typeof ErrorResponseSchema>;
```

### Utilidades de Tipo
```typescript
// Type guards
export const isSuccessResponse = <T>(
  response: SuccessResponse<T> | ErrorResponse
): response is SuccessResponse<T> => response.success;

export const isErrorResponse = (
  response: SuccessResponse<any> | ErrorResponse
): response is ErrorResponse => !response.success;

// Extractores de datos
export const extractData = <T>(response: SuccessResponse<T>): T => response.data;
export const extractError = (response: ErrorResponse): string => 
  response.message || response.error?.code || 'Error desconocido';
```

## 📝 Convenciones de Naming

### Endpoints
- **GET** `/users` → Lista de usuarios
- **GET** `/users/:id` → Usuario específico  
- **POST** `/users` → Crear usuario
- **PUT** `/users/:id` → Actualizar usuario
- **DELETE** `/users/:id` → Eliminar usuario

### Schemas
- **Entity**: `UserSchema`, `ProductSchema`
- **Request**: `CreateUserSchema`, `UpdateUserSchema`
- **Response**: `UserResponseSchema`, `UserListResponseSchema`

### Hooks Generados
- **Query**: `useUser`, `useUsers`
- **Mutation**: `useCreateUser`, `useUpdateUser`, `useDeleteUser`
