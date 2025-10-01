# RFC: Data Orchestrator

## Resumen Ejecutivo

Propuesta para implementar un sistema de orquestación de carga de datos que:
- Agregue múltiples hooks de API (`useList`, `useQuery`) automáticamente
- Maneje estados de loading y error de forma centralizada
- Provea 2 modos de uso: **Hook personalizado** (máxima flexibilidad) y **HOC** (declarativo)
- Soporte configuración global de componentes de loading/error via `DataOrchestratorProvider`
- Mantenga tipado completo de TypeScript con enfoque pragmático (sin discriminated unions)
- Distinga entre recursos **required** (críticos) y **optional** (no bloquean rendering)

## Contexto

Actualmente, cuando una página necesita datos de múltiples dominios, cada componente maneja su propio loading y error state:

```tsx
function Dashboard() {
  const { data: users, loading: usersLoading, error: usersError } = usersApi.useList();
  const { data: profile, loading: profileLoading, error: profileError } = profileApi.useQuery(userId);
  const { data: stats, loading: statsLoading, error: statsError } = statsApi.useList();

  // Manual aggregation
  const isLoading = usersLoading || profileLoading || statsLoading;
  const hasErrors = !!(usersError || profileError || statsError);
  
  if (isLoading) return <LoadingSpinner />;
  if (hasErrors) return <ErrorPage />;
  
  return <div>...</div>;
}
```

**Problemas:**
- Código repetitivo en cada página
- Inconsistencia en manejo de loading/error
- Difícil mantener UX consistente
- No hay forma de distinguir recursos críticos de opcionales

## Objetivos

1. **Simplificar el código de páginas** reduciendo boilerplate
2. **Estandarizar UX** de loading y error en toda la aplicación
3. **Mantener flexibilidad** para casos avanzados
4. **Type safety completo** con TypeScript
5. **Soporte para recursos críticos vs opcionales**

## Propuesta de API

### Modo 1: Hook Personalizado `useDataOrchestrator` (Más flexible)

El desarrollador obtiene estados agregados y granulares, maneja el rendering manualmente.

#### Ejemplo Básico

```tsx
import { useDataOrchestrator } from 'react-proto-kit';

function Dashboard() {
  const { data, isLoading, isFetching, hasErrors, errors, retryAll } = useDataOrchestrator({
    users: usersApi.useList,
    profile: () => profileApi.useQuery(userId),
  });

  // Primera carga - bloquea rendering
  if (isLoading) return <FullPageLoader />;
  if (hasErrors) return <ErrorPage errors={errors} onRetry={retryAll} />;

  return (
    <div>
      {/* Refetch en background - no bloquea UI */}
      {isFetching && (
        <div style={{ position: 'fixed', top: 10, right: 10 }}>
          <SmallSpinner />
        </div>
      )}
      
      <h1>Users: {data.users!.length}</h1>
      <h2>Profile: {data.profile!.name}</h2>
    </div>
  );
}
```

#### Tipo de Retorno (Completamente Tipado)

```tsx
  // Datos tipados por dominio (pueden ser null hasta que cargan)
  data: {
    [K in keyof T]: ExtractDataType<T[K]> | null;
  };
  
  // Estados agregados
  isLoading: boolean;      // Primer load de recursos required (bloquea rendering)
  isFetching: boolean;     // Refetch en background (no bloquea, solo indicador)
  hasErrors: boolean;
  
  // Estados granulares por recurso
  loadingStates: {
    [K in keyof T]: boolean;
  };

  errors: {
    [K in keyof T]?: ErrorResponse;
  };
  
  // Funciones de retry
  retry: (key: keyof T) => Promise<void>;        // Reintentar un recurso específico
  retryAll: () => Promise<void>;                 // Reintentar todos los recursos
// Ejemplo de tipos inferidos
const result = useDataOrchestrator({
  users: usersApi.useList,
  profile: () => profileApi.useQuery('user-123'),
});

// TypeScript infiere:
// result.data.users: CompleteEntityType<User>[] | null
// result.data.profile: CompleteEntityType<Profile> | null
// result.loadingStates.users: boolean
// result.errors.profile?: ErrorResponse

// Nota: Usa ? o ! para acceder a data después del check
if (!isLoading && !hasErrors) {
  console.log(result.data.users!.length);  // Non-null assertion
  // o
  console.log(result.data.users?.length);  // Optional chaining
}

// Diferencia clave: isLoading vs isFetching
const { isLoading, isFetching, retryAll } = result;

// isLoading: true solo en PRIMER load de recursos required
// isFetching: true en primer load Y refetches (útil para spinners no-bloqueantes)
```

#### Con Recursos Required vs Optional

```tsx
function Dashboard() {
  const { data, isLoading, isFetching, hasErrors, errors, retry } = useDataOrchestrator({
    required: {
      users: usersApi.useList,
      profile: () => profileApi.useQuery(userId),
    },
    optional: {
      stats: statsApi.useList,
      recentActivity: activityApi.useList,
    },
  });

  // isLoading solo espera recursos required (críticos)
  // hasErrors solo considera errores de recursos required
  
  if (isLoading) return <Loader />;
  if (hasErrors) return <ErrorPage errors={errors} />;

  return (
    <div>
      {/* Indicador de refetch global */}
      {isFetching && <TopBarSpinner />}
      
      <h1>Users: {data.users!.length}</h1>
      
      {/* Recursos opcionales - manejan su propio loading/error */}
      {data.stats && <StatsWidget data={data.stats} />}
      {errors.stats && (
        <InlineError error={errors.stats}>
          <button onClick={() => retry('stats')}>Retry Stats</button>
        </InlineError>
      )}
    </div>
  );
}
```

#### Liberación Progresiva de Datos

```tsx
function Dashboard() {
  const { data, isLoading, isFetching, loadingStates, errors, retry, retryAll } = useDataOrchestrator({
    users: usersApi.useList,
    profile: () => profileApi.useQuery(userId),
    stats: statsApi.useList,
  });

  return (
    <div>
      {/* Renderizar partes de la UI conforme van llegando */}
      
      <section>
        <h2>Users</h2>
        {loadingStates.users ? (
          <Skeleton />
        ) : errors.users ? (
          <ErrorBanner error={errors.users} />
        ) : (
          <UserList users={data.users!} />
        )}
      </section>

      <section>
        <h2>Profile</h2>
        {loadingStates.profile ? (
          <Skeleton />
        ) : data.profile ? (
          <ProfileCard profile={data.profile} />
        ) : null}
      </section>

      <section>
        <h2>Statistics</h2>
        {loadingStates.stats ? (
          <Skeleton />
        ) : errors.stats ? (
          <div>
            <ErrorBanner error={errors.stats} />
            <button onClick={() => retry('stats')}>Retry Stats</button>
          </div>
        ) : (
          <StatsWidget data={data.stats!} />
        )}
      </section>
      
      {/* Botón global de retry */}
      {isFetching && (
        <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
          <button onClick={retryAll}>🔄 Refresh All</button>
        </div>
      )}
    </div>
  );
}
```

---

### Modo 2: HOC `withDataOrchestrator` (Declarativo)

Envuelve el componente y solo renderiza cuando todos los datos críticos están listos.

#### Ejemplo Básico

```tsx
import { withDataOrchestrator } from 'react-proto-kit';

interface DashboardProps {
  users: CompleteEntityType<User>[];
  profile: CompleteEntityType<Profile>;
}

function DashboardContent({ users, profile }: DashboardProps) {
  return (
    <div>
      <h1>Users: {users.length}</h1>
      <h2>Profile: {profile.name}</h2>
    </div>
  );
}

// HOC maneja loading/error automáticamente
export const Dashboard = withDataOrchestrator(DashboardContent, {
  users: usersApi.useList,
  profile: () => profileApi.useQuery('user-123'),
});
```

#### Con Configuración Avanzada

```tsx
export const Dashboard = withDataOrchestrator(DashboardContent, {
  hooks: {
    required: {
      users: usersApi.useList,
      profile: () => profileApi.useQuery('user-123'),
    },
    optional: {
      stats: statsApi.useList,
    },
  },
  
  // Componentes personalizados (opcional)
  loader: <CustomPageLoader message="Loading dashboard..." />,
  errorComponent: ({ errors, retry }) => (
    <CustomErrorPage 
      errors={errors} 
      onRetry={retry}
    />
  ),
  
  // Callback cuando todo está listo (opcional)
  onDataReady: ({ users, profile, stats }) => {
    console.log('Dashboard data loaded', { users, profile, stats });
  },
});
```

#### Tipo de Props Inferido

```tsx
// TypeScript infiere automáticamente los props del componente wrapped
function DashboardContent(props: {
  // Recursos required (siempre presentes después de loading)
  users: CompleteEntityType<User>[];
  profile: CompleteEntityType<Profile>;
  
  // Recursos optional (pueden ser null)
  stats?: CompleteEntityType<Stats>[] | null;
  
  // Metadata siempre disponible
  _orchestratorData: {
    loadingStates: { users: boolean; profile: boolean; stats: boolean };
    errors: { users?: ErrorResponse; profile?: ErrorResponse; stats?: ErrorResponse };
    refetch: { users: () => void; profile: () => void; stats: () => void };
  };
}) {
  // ...
}
```

---

## ¿Por qué solo Hook + HOC?

Inicialmente consideramos un tercer modo con Component Wrapper `<DataOrchestrator>`, pero decidimos **no implementarlo** por:

1. **Redundancia**: Es muy similar al Hook en funcionalidad, solo cambia la sintaxis
2. **Complejidad**: Render props añaden verbosidad sin beneficio claro
3. **Dos modos suficientes**:
   - **Hook**: Para máxima flexibilidad y control granular
   - **HOC**: Para simplicidad declarativa "todo o nada"

**Ejemplo de lo que NO vamos a implementar:**
```tsx
// ❌ NO implementaremos esto - redundante con el hook
<DataOrchestrator hooks={{ users: usersApi.useList }}>
  {({ data }) => <div>{data.users?.length}</div>}
</DataOrchestrator>

// ✅ Usa el hook directamente - mismo resultado, más directo
const { data } = useDataOrchestrator({ users: usersApi.useList });
return <div>{data.users?.length}</div>;
```

---

## Comparación de Modos

| Característica | `useDataOrchestrator` Hook | `withDataOrchestrator` HOC |
|----------------|-------------------|-------------------|
| **Flexibilidad** | ⭐⭐⭐⭐⭐ Total | ⭐⭐⭐ Media |
| **Simplicidad** | ⭐⭐⭐ Media | ⭐⭐⭐⭐⭐ Muy simple |
| **Type Safety** | ⭐⭐⭐⭐⭐ Perfecto | ⭐⭐⭐⭐ Muy bueno |
| **Loading progresivo** | ✅ Sí | ❌ No (todo o nada) |
| **Custom loader/error** | ✅ Manual | ✅ Automático |
| **Recursos opcionales** | ✅ Sí | ✅ Sí |
| **Boilerplate** | Bajo | Muy bajo |
| **Uso recomendado** | Dashboards complejos, carga progresiva | Páginas simples, CRUD básico |

---

## Configuración Global via Provider

Para evitar repetir componentes de loader/error, se puede configurar globalmente:

```tsx
import { DataOrchestratorProvider } from 'react-proto-kit';

function App() {
  return (
    <ApiClientProvider connectorType="fetch" config={{ baseUrl: '/api' }}>
      <GlobalStateProvider>
        <DataOrchestratorProvider
          defaultLoader={<FullPageLoader />}
          defaultErrorComponent={({ errors, retry }) => (
            <FullPageError errors={errors} onRetry={retry} />
          )}
          // Opcional: modo por defecto
          mode="fullscreen" // "fullscreen" | "passive"
        >
          <Router>
            <Routes />
          </Router>
        </DataOrchestratorProvider>
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}
```

### Uso después de configurar Provider

```tsx
// Con HOC - usa componentes globales automáticamente
export const Dashboard = withDataOrchestrator(DashboardContent, {
  users: usersApi.useList,
  profile: () => profileApi.useQuery('user-123'),
  // No necesita especificar loader/error, usa los globales
});

// Puede sobrescribir los globales si es necesario
export const SpecialPage = withDataOrchestrator(SpecialContent, {
  users: usersApi.useList,
  loader: <SpecialLoader />, // Override del global
});
```

---

## TypeScript: Inferencia de Tipos

### Extracción Automática de Tipos

```tsx
// El sistema extrae automáticamente los tipos de los hooks
const config = {
  users: usersApi.useList,                    // → CompleteEntityType<User>[]
  profile: () => profileApi.useQuery('123'),  // → CompleteEntityType<Profile>
  todos: todosApi.useList,                    // → CompleteEntityType<Todo>[]
};

const { data } = useDataOrchestrator(config);

// TypeScript infiere:
data.users;    // CompleteEntityType<User>[] | null
data.profile;  // CompleteEntityType<Profile> | null
data.todos;    // CompleteEntityType<Todo>[] | null
```

### Con Recursos Required/Optional

```tsx
const { data } = useDataOrchestrator({
  required: {
    users: usersApi.useList,
  },
  optional: {
    stats: statsApi.useList,
  },
});

// Required: garantizados después de isLoading = false
data.users;  // CompleteEntityType<User>[]

// Optional: pueden ser null incluso después de loading
data.stats;  // CompleteEntityType<Stats>[] | null
```

### Helper Types Exportados

```tsx
import type { 
  DataOrchestratorConfig,
  UseDataOrchestratorResult,
  ExtractDataFromConfig,
} from 'react-proto-kit';

// Para definir tipos de páginas reutilizables
type DashboardData = ExtractDataFromConfig<typeof dashboardConfig>;
// → { users: User[]; profile: Profile; stats: Stats[] | null }

// Para tipar funciones que reciben configuración
function createPageLoader<T extends DataOrchestratorConfig>(config: T) {
  // ...
}
```

---

## Casos de Uso Detallados

### Caso 1: Dashboard Simple (Todo o Nada)

```tsx
export const Dashboard = withDataOrchestrator(DashboardContent, {
  users: usersApi.useList,
  revenue: revenueApi.useList,
  orders: ordersApi.useList,
});

function DashboardContent({ users, revenue, orders }) {
  // Todos los datos garantizados aquí
  return (
    <div>
      <MetricsCard users={users.length} revenue={revenue.total} />
      <OrdersTable orders={orders} />
    </div>
  );
}
```

### Caso 2: Página con Carga Progresiva + Retry Granular

```tsx
function ProductPage({ productId }: { productId: string }) {
  const { data, loadingStates, errors, retry } = useDataOrchestrator(
    {
      required: {
        product: () => productsApi.useQuery(productId),
      },
      optional: {
        reviews: () => reviewsApi.useList({ productId }),
        related: () => productsApi.useList({ category: 'similar' }),
      },
    },
    { resetKey: productId }
  );

  return (
    <div>
      {/* Producto crítico - bloqueante */}
      {loadingStates.product ? (
        <ProductSkeleton />
      ) : (
        <ProductDetails product={data.product!} />
      )}

      {/* Reviews opcionales - no bloquea la página */}
      <section>
        <h2>Reviews</h2>
        {loadingStates.reviews ? (
          <ReviewsSkeleton />
        ) : errors.reviews ? (
          <div>
            <ErrorBanner error={errors.reviews} />
            <button onClick={() => retry('reviews')}>🔄 Retry Reviews</button>
          </div>
        ) : (
          <ReviewsList reviews={data.reviews} />
        )}
      </section>

      {/* Relacionados opcionales */}
      <section>
        {data.related && <RelatedProducts products={data.related} />}
      </section>
    </div>
  );
}
```

### Caso 3: Página con Parámetros Dinámicos + resetKey

```tsx
function UserProfile() {
  const { userId } = useParams();
  
  // resetKey: Resetea el estado interno cuando cambia userId
  // Evita estados inconsistentes al cambiar de usuario
  const { data, isLoading, isFetching, hasErrors, retryAll } = useDataOrchestrator(
    {
      profile: () => usersApi.useQuery(userId),
      posts: () => postsApi.withParams({ userId }).useList(),
      followers: () => followersApi.withParams({ userId }).useList(),
    },
    { resetKey: userId }  // 🔑 Resetea cuando cambia el parámetro
  );

  if (isLoading) return <Loader />;
  if (hasErrors) return <ErrorPage onRetry={retryAll} />;

  return (
    <div>
      {/* Spinner para refetch cuando el usuario hace pull-to-refresh */}
      {isFetching && <RefreshIndicator />}
      
      <ProfileHeader profile={data.profile!} />
      <PostsList posts={data.posts!} />
      <FollowersList followers={data.followers!} />
    </div>
  );
}
```

### Caso 4: Página con Dependencias entre Datos

```tsx
function TeamPage() {
  // Primera carga: obtener el team
  const { data: team, loading: teamLoading } = teamsApi.useQuery(teamId);
  
  // Segunda carga: cuando tengamos el team, cargar sus miembros
  const { data, isLoading, errors } = useDataOrchestrator(
    team ? {
      members: () => usersApi.useList({ teamId: team.id }),
      projects: () => projectsApi.useList({ teamId: team.id }),
      activity: () => activityApi.useList({ teamId: team.id }),
    } : null // null desactiva useDataOrchestrator hasta que team esté listo
  );

  if (teamLoading || isLoading) return <Loader />;
  
  return (
    <div>
      <TeamHeader team={team} />
      <MembersList members={data?.members} />
      <ProjectsList projects={data?.projects} />
    </div>
  );
}
```

---

## Implementación Interna (Overview)

### Hook Core: `useDataOrchestrator`

```tsx
function useDataOrchestrator<T extends DataOrchestratorConfig>(config: T | null): UseDataOrchestratorResult<T> {
  const [data, setData] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, ErrorResponse>>({});

  // Ejecutar cada hook y agregar sus estados
  const hookResults = useMemo(() => {
    if (!config) return {};
    
    return Object.entries(config).reduce((acc, [key, hookFactory]) => {
      const result = hookFactory();
      
      acc[key] = {
        data: result.data,
        loading: result.loading,
        error: result.error,
        refetch: result.refetch,
      };
      
      return acc;
    }, {} as Record<string, any>);
  }, [config]);

  // Actualizar estados agregados
  useEffect(() => {
    const newData: Record<string, any> = {};
    const newLoading: Record<string, boolean> = {};
    const newErrors: Record<string, ErrorResponse> = {};

    Object.entries(hookResults).forEach(([key, result]) => {
      newData[key] = result.data;
      newLoading[key] = result.loading;
      if (result.error) newErrors[key] = result.error;
    });

    setData(newData);
    setLoadingStates(newLoading);
    setErrors(newErrors);
  }, [hookResults]);

  // Calcular estados agregados
  const isLoading = Object.values(loadingStates).some(Boolean);
  const hasErrors = Object.keys(errors).length > 0;

  return {
    data: data as any,
    isLoading,
    hasErrors,
    loadingStates: loadingStates as any,
    errors: errors as any,
    refetch: {} as any, // implementar
  };
}
```

---

## Decisiones de Diseño

### ✅ Decisiones Confirmadas

1. **2 modos de uso**: Hook + HOC (sin Component wrapper por redundancia)
2. **Estados granulares + agregados**: Máxima flexibilidad
3. **Recursos required vs optional**: Esencial para UX
4. **Configuración global via Provider**: Evita repetición
5. **Type safety pragmático**: Sin discriminated unions, usa `?` o `!` después del check
6. **Liberación progresiva de datos**: Solo en modo Hook

### ✅ Decisiones Confirmadas (2025-10-01)

1. **Naming**: `useDataOrchestrator` (más genérico y descriptivo)
2. **Provider**: `DataOrchestratorProvider` (configuración global)
3. **Recursos por defecto**: `required` (críticos, bloquean rendering hasta que cargan)
4. **Recursos opcionales con error**: 
   - Console warning para debugging
   - Error disponible en objeto `errors` para que el dev decida cómo manejarlo
5. **Prioridad de implementación**: 
   - ✅ Fase 1: Hook (`useDataOrchestrator`)
   - 🔜 Fase 2: HOC (`withDataOrchestrator`)
   - ❌ Component wrapper descartado (redundante con Hook)

### ❓ Decisiones Pendientes (Futuro)

1. **Retry strategy**: ¿Automático en errores? ¿Configuración por recurso?
2. **Timeout**: ¿Configurar timeout máximo para recursos required?
3. **Suspense integration**: ¿Soporte futuro para React Suspense?
4. **DevTools**: ¿Herramientas de debug para ver estado de todos los recursos?

---

## Decisiones de API Confirmadas

### Naming Conventions ✅

- **Hook**: `useDataOrchestrator` (genérico, claro)
- **Provider**: `DataOrchestratorProvider` (consistente)
- **HOC**: `withDataOrchestrator` (sigue patrón HOC)
- **Component**: `<DataOrchestrator>` (descriptivo)
- **Recursos críticos**: `required` (más claro que "critical")
- **Recursos opcionales**: `optional` (estándar)

### Comportamiento por Defecto ✅

- Cuando no se especifica `required`/`optional`, **todos los recursos son `required`**
- Los recursos `required` bloquean el rendering hasta que cargan
- Los recursos `optional` liberan datos progresivamente y no bloquean

### Manejo de Errores ✅

- **Recursos required con error**: Activan `hasErrors = true` y bloquean rendering
- **Recursos optional con error**: 
  - Console warning automático para debugging
  - Error disponible en `errors[key]` para manejo custom
  - No bloquean rendering de la página

---

## Plan de Implementación

### Fase 1: Core Hook (En Progreso) 🚧
1. ✅ Definir types en `/src/types/index.ts`
2. 🔄 Implementar `useDataOrchestrator` hook
3. 🔄 Implementar `DataOrchestratorProvider` context
4. ⏳ Crear ejemplo básico en `/examples`
5. ⏳ Escribir tests para hook core

### Fase 2: HOC (Pendiente)
1. Implementar `withDataOrchestrator` HOC
2. Tests de HOC
3. Ejemplos de uso

### Fase 3: Documentación y Refinamiento
1. Actualizar README principal
2. Crear guía de uso detallada
3. Ejemplos de casos reales
4. Migration guide (si aplica)

---

## Nuevas Features Incorporadas

### 1. `isLoading` vs `isFetching` 🔥

**Problema que resuelve**: Antes solo teníamos `isLoading`, que era `true` tanto en el primer load como en refetches. Esto obligaba a:
- Bloquear la UI en refetches (mala UX)
- O no mostrar indicador de carga (confuso para el usuario)

**Solución**:
```tsx
const { isLoading, isFetching } = useDataOrchestrator({ users: usersApi.useList });

// isLoading: true SOLO en el PRIMER load de recursos required
if (isLoading) return <FullPageLoader />;  // Bloquea la UI

// isFetching: true en primer load Y refetches
return (
  <div>
    {isFetching && <TopBarSpinner />}  {/* No bloquea, solo indica */}
    <UserList users={data.users!} />
  </div>
);
```

### 2. `resetKey` Option 🔑

**Problema que resuelve**: Al cambiar parámetros de ruta (ej. `/users/123` → `/users/456`), el estado del orchestrator puede quedar inconsistente:
- Data del usuario anterior visible brevemente
- Loading states mezclados entre usuarios
- Errores de usuario anterior persistentes

**Solución**:
```tsx
const { userId } = useParams();

const result = useDataOrchestrator(
  {
    user: () => usersApi.useQuery(userId),
    posts: () => postsApi.useList({ userId }),
  },
  { resetKey: userId }  // Resetea TODO cuando cambia userId
);

// Cuando userId cambia de '123' a '456':
// 1. Estado se resetea completamente
// 2. isLoading vuelve a true
// 3. Data anterior se limpia
// 4. Se ejecutan los hooks con nuevo userId
```

### 3. Retry Granular + Retry All 🔄

**Problema que resuelve**: Antes solo podías refetch todos los recursos juntos. Si un recurso opcional fallaba, tenías que recargar TODA la página.

**Solución**:
```tsx
const { data, errors, retry, retryAll } = useDataOrchestrator({
  required: {
    users: usersApi.useList,
  },
  optional: {
    stats: statsApi.useList,
    activity: activityApi.useList,
  },
});

return (
  <div>
    {/* Retry individual - solo recarga stats */}
    {errors.stats && (
      <button onClick={() => retry('stats')}>Retry Stats Only</button>
    )}
    
    {/* Retry all - recarga todos los recursos */}
    <button onClick={retryAll}>🔄 Refresh Everything</button>
  </div>
);
```

---

## Anexo: API Completa de TypeScript

```tsx
// ============================================================================
// TYPES
// ============================================================================

type QueryHookFactory<T> = () => UseQueryResult<T>;

type DataOrchestratorConfig = {
  [key: string]: QueryHookFactory<any>;
};

type RequiredOptionalConfig = {
  required?: DataOrchestratorConfig;
  optional?: DataOrchestratorConfig;
};

type DataOrchestratorInput<T> = T | RequiredOptionalConfig | null;

// ============================================================================
// HOOK
// ============================================================================

// Hook options
interface UseDataOrchestratorOptions {
  resetKey?: string | number;  // Resetea estado cuando cambia
  onError?: (errors: Record<string, ErrorResponse>) => void;
}

export function useDataOrchestrator<T extends DataOrchestratorConfig>(
  config: T | null,
  options?: UseDataOrchestratorOptions
): UseDataOrchestratorResult<T>;

export function useDataOrchestrator<T extends RequiredOptionalConfig>(
  config: T,
  options?: UseDataOrchestratorOptions
): UseDataOrchestratorResultWithOptional<T>;

interface UseDataOrchestratorResult<T extends DataOrchestratorConfig> {
  data: {
    [K in keyof T]: ExtractDataType<T[K]> | null;
  };
  isLoading: boolean;      // Primer load de required (bloquea)
  isFetching: boolean;     // Primer load + refetches (indicador)
  hasErrors: boolean;
  loadingStates: {
    [K in keyof T]: boolean;
  };
  errors: {
    [K in keyof T]?: ErrorResponse;
  };
  retry: (key: keyof T) => void;        // Retry individual
  retryAll: () => void;                 // Retry todos
  refetch: {                            // Legacy (usar retry)
    [K in keyof T]: () => Promise<void>;
  };
}

// ============================================================================
// HOC
// ============================================================================

export function withDataOrchestrator<
  TConfig extends DataOrchestratorConfig,
  TProps extends Record<string, any>
>(
  Component: React.ComponentType<TProps & ExtractPropsFromConfig<TConfig>>,
  config: TConfig | {
    hooks: TConfig | RequiredOptionalConfig;
    loader?: React.ReactNode;
    errorComponent?: React.ComponentType<ErrorComponentProps>;
    onDataReady?: (data: ExtractDataFromConfig<TConfig>) => void;
  }
): React.ComponentType<TProps>;

// ============================================================================
// PROVIDER
// ============================================================================

export function DataOrchestratorProvider(props: {
  children: React.ReactNode;
  defaultLoader?: React.ReactNode;
  defaultErrorComponent?: React.ComponentType<DataOrchestratorErrorProps>;
  mode?: 'fullscreen' | 'passive';
}): JSX.Element;

// ============================================================================
// HELPER TYPES
// ============================================================================

type ExtractDataType<T> = T extends HookFactory<infer U> ? U : never;

type ExtractDataFromConfig<T extends DataOrchestratorConfig> = {
  [K in keyof T]: ExtractDataType<T[K]>;
};

type ExtractPropsFromConfig<T extends DataOrchestratorConfig> = {
  [K in keyof T]: ExtractDataType<T[K]>;
} & {
  _orchestratorData: {
    loadingStates: { [K in keyof T]: boolean };
    errors: { [K in keyof T]?: ErrorResponse };
    refetch: { [K in keyof T]: () => void };
  };
};

interface DataOrchestratorErrorProps {
  errors: Record<string, ErrorResponse>;
  retry?: () => void;
}
```

---

## Estado del RFC

**Estado**: 🟡 Pendiente Aprobación Final - Mejorado

**Cambios vs Versión Anterior**:
- ❌ Eliminado Component `<DataOrchestrator>` (redundante)
- ✅ Mantenido enfoque pragmático de tipos (sin discriminated unions)
- ✅ Solo Hook + HOC
- ✅ **NUEVO**: `isLoading` vs `isFetching` (mejor UX)
- ✅ **NUEVO**: `resetKey` option (evita estados inconsistentes)
- ✅ **NUEVO**: `retry(key)` + `retryAll()` (retry granular)

**Decisiones Confirmadas**: Pendientes de validación final

**Próximo Milestone**: Aprobar RFC simplificado → Implementar `useDataOrchestrator` y `DataOrchestratorProvider`

**Autor**: React Proto Kit Team  
**Fecha**: 2025-10-01
