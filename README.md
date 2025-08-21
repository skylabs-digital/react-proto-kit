# React API Client Service Library

Una librería React genérica que proporciona un factory para generar APIs de dominio con backend desacoplado, permitiendo validar modelos en frontend y cambiar conectores de forma transparente.

## 🎯 Objetivo

Facilitar el desarrollo frontend-first permitiendo:
- Validación temprana de modelos usando localStorage
- Transición transparente a APIs reales
- Generación automática de clientes basados en JSON Schema
- Hooks React con estados de loading/error estandarizados

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend App                           │
│                                                             │
│ ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│ │ Components  │    │ App Schemas  │    │   App Hooks     │ │
│ │             │    │ (UserSchema, │    │ (useUsers,      │ │
│ │             │    │ ProductSchema)│    │ useProducts)    │ │
│ └─────────────┘    └──────────────┘    └─────────────────┘ │
│                           │                       │         │
└───────────────────────────┼───────────────────────┼─────────┘
                            │                       │
┌───────────────────────────┼───────────────────────┼─────────┐
│              @skylabs/api-client-service           │         │
│                           │                       │         │
│ ┌─────────────────────────▼─┐    ┌────────────────▼───────┐ │
│ │    Global Provider        │    │    Client Factory      │ │
│ │  (localStorage/fetch)     │    │  (createClient)        │ │
│ └─────────────────────────┬─┘    └────────────────────────┘ │
│                           │                                 │
│ ┌─────────────────────────▼─────────────────────────────────┐ │
│ │              Connector Implementation                     │ │
│ │         (LocalStorageConnector | FetchConnector)         │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Principales

### 1. **Provider Global**
- Configuración única de conector (localStorage/fetch)
- Inyección automática en todos los clientes
- Cambio transparente entre entornos

### 2. **Domain API Factory**
- Factory genérico para generar APIs de cualquier dominio
- Usa el provider global configurado automáticamente
- Cada app define sus propios dominios y esquemas

### 3. **Esquemas de Aplicación**
- Definidos en cada frontend app
- Validaciones con TypeBox/Zod
- Contratos compartidos frontend/backend

### 4. **Hooks React Generados**
- Estados de loading/error automáticos
- Conectados al provider global
- Manejo de errores estandarizado

## 📋 Casos de Uso

1. **Configuración Global del Provider**
   ```typescript
   // main.tsx - Desarrollo
   <ApiClientProvider connector="localStorage" config={{ simulateDelay: 300 }}>
     <App />
   </ApiClientProvider>
   
   // main.tsx - Producción
   <ApiClientProvider connector="fetch" config={{ baseUrl: '/api' }}>
     <App />
   </ApiClientProvider>
   ```

2. **Uso en la App (Sin cambios)**
   ```typescript
   // UserSchema definido en la app
   const UserSchema = Type.Object({ id: Type.String(), name: Type.String() });
   
   // Factory genera API de dominio
   const userApi = createDomainApi({ entity: 'users', schema: UserSchema });
   const { data, loading, error } = userApi.useList();
   ```

3. **Generación de Backend**
   ```typescript
   // Los mismos esquemas se usan para generar el backend
   export const UserSchema = Type.Object({
     id: Type.String(),
     name: Type.String(),
     email: Type.String({ format: 'email' })
   });
   ```

## 🚀 Beneficios

- **Desarrollo Ágil**: Prototipa sin backend
- **Type Safety**: Validaciones en compile-time y runtime
- **Consistencia**: Patrones estandarizados de respuesta
- **Flexibilidad**: Conectores intercambiables
- **Productividad**: Hooks generados automáticamente
- **Contrato Único**: Esquemas compartidos frontend/backend

## 📁 Estructura del Proyecto

**Librería (@skylabs/api-client-service):**
```
src/
├── provider/            # Provider global de conectores
├── connectors/          # Implementaciones de conectores
├── factory/             # Client factory y generadores
├── schemas/             # Esquemas de respuesta base (ErrorResponse, etc.)
├── hooks/               # Hook generators
├── types/               # Tipos TypeScript base
└── utils/               # Utilidades comunes
```

**Frontend App:**
```
src/
├── schemas/             # Esquemas de la app (UserSchema, etc.)
├── hooks/               # Hooks generados para la app
├── components/          # Componentes React
└── main.tsx            # Configuración del provider
```

## 🚀 Flujo Ideal para Máxima Agilidad

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
  }
});
```

## 🎯 Próximos Pasos

1. **Helpers de Esquemas**: `createEntitySchema()`, `createTimestampedSchema()`
2. **Templates CRUD**: `createCrudApi()`, `createReadOnlyApi()`
3. **Convenciones Automáticas**: Naming y tipos auto-generados
4. **Configuración Simplificada**: Setup por entorno en una línea
5. **DevTools Opcionales**: CLI y debugging integrado
