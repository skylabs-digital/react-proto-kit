# Guía de migración: mutation hooks en react-proto-kit v2.0.0

## TL;DR

Todos los hooks de mutación (`useCreate`, `useUpdate`, `usePatch`, `useDelete`, y los tres `useSingleRecord*`) ahora retornan `Promise<ApiResponse<T>>` y **nunca lanzan excepciones**. El consumidor reacciona al resultado con un check explícito del campo `success`, en vez de con `try/catch`.

```ts
const res = await updateTodo.mutate(id, data);
if (!res.success) {
  // manejo de error
  return;
}
// res.data es la entidad actualizada
```

Este es un cambio breaking. Esta guía explica el porqué y cómo migrar cada patrón común.

## Por qué cambió

Antes de v2, las mutaciones tenían semántica inconsistente y rota:

- `useCreate` retornaba `Promise<TOutput>` y **lanzaba** en error.
- `useUpdate`, `usePatch`, `useDelete`, y los `useSingleRecord*` retornaban `Promise<void>` y **nunca lanzaban** — solo actualizaban el estado `error` interno del hook.

Esto producía un bug sistémico en todos los call sites del backoffice: decenas de archivos tenían código así:

```ts
// ❌ ANTES (v1) — este try/catch nunca atrapaba para update/patch/delete
try {
  await updateTodo.mutate(id, data);
  showSnackbar({ message: 'Actualizado', variant: 'success' });
  navigate('/todos');
} catch (err) {
  showSnackbar({ message: 'Error', variant: 'error' });
}
```

El `catch` nunca se ejecutaba porque la mutación jamás lanzaba. Si el backend devolvía `{ success: false, message: "Stock insuficiente" }`, el código mostraba "Actualizado" y navegaba a pesar de que la operación había fallado.

La "solución obvia" — leer `updateTodo.error` después del `await` — no funciona por el problema de closures stale: después de `await mutate()`, el closure del event handler todavía apunta al valor de `error` del render anterior. Se necesitarían refs o effects para leer el valor actualizado, lo cual es frágil.

La solución real es **retornar el `ApiResponse` desde `mutate()` mismo**, así el consumidor tiene el resultado real post-await sin depender del state del hook.

## El patrón canónico

```ts
const { mutate: updateTodo, loading, error } = todosApi.useUpdate();

const handleSave = async () => {
  const res = await updateTodo(id, data);
  if (!res.success) {
    showSnackbar({ message: res.message, variant: 'error' });
    return;
  }
  showSnackbar({ message: 'Actualizado', variant: 'success' });
  navigate('/todos');
};
```

Tres invariantes importantes:

1. `mutate()` **siempre** resuelve a un `ApiResponse<T>`. Nunca retorna `undefined` ni lanza.
2. El branch `success: true` contiene `data`. TypeScript estrecha el tipo si usás un type guard o `if (!res.success) return`.
3. El estado `error` del hook se mantiene sincronizado con el último `ErrorResponse`, útil para renderizar un banner persistente. Pero **no lo uses post-await en handlers** — usá el return value.

## Tipos

```ts
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

// Nota: en v3 ErrorResponse pasó a ser una discriminated union.
// Ver la sección "v2 → v3" más abajo para el shape actual.
interface ErrorResponse {
  success: false;
  message?: string;
  error?: { code: string };
  type?: 'AUTH' | 'VALIDATION' | 'TRANSACTION' | 'NAVIGATION';
  validation?: Record<string, string>; // errores de campo para formularios
  data?: Record<string, unknown>;      // campos extra del body de error
}
```

Las firmas de los hooks ahora son:

```ts
useCreate():  { mutate: (data: T)           => Promise<ApiResponse<Entity>>, loading, error }
useUpdate():  { mutate: (id: string, data)  => Promise<ApiResponse<Entity>>, loading, error }
usePatch():   { mutate: (id: string, data)  => Promise<ApiResponse<Entity>>, loading, error }
useDelete():  { mutate: (id: string)        => Promise<ApiResponse<void>>,   loading, error }

useSingleRecordUpdate():  { mutate: (data) => Promise<ApiResponse<Entity>>, loading, error }
useSingleRecordPatch():   { mutate: (data) => Promise<ApiResponse<Entity>>, loading, error }
useSingleRecordReset():   { mutate: ()     => Promise<ApiResponse<void>>,   loading, error }
```

## Casos de migración

### Caso 1: try/catch roto (el más común)

Este es el patrón que no funcionaba. Aproximadamente el 90% de los call sites del backoffice están así.

**Antes:**
```ts
const handleUpdate = async () => {
  try {
    await updateTodo.mutate(id, data);
    showSnackbar({ message: 'Actualizado', variant: 'success' });
    navigate('/todos');
  } catch (err) {
    showSnackbar({ message: 'Error al actualizar', variant: 'error' });
  }
};
```

**Después:**
```ts
const handleUpdate = async () => {
  const res = await updateTodo.mutate(id, data);
  if (!res.success) {
    showSnackbar({
      message: res.message ?? 'Error al actualizar',
      variant: 'error',
    });
    return;
  }
  showSnackbar({ message: 'Actualizado', variant: 'success' });
  navigate('/todos');
};
```

La estructura cambia de try/catch a early return. Más legible y, crítico, ahora el error path **sí se ejecuta** cuando el backend devuelve `success: false`.

### Caso 2: fire-and-forget sin feedback

**Antes:**
```ts
const toggleComplete = async (id: string, completed: boolean) => {
  await patchTodo.mutate(id, { completed });
};
```

**Después (no necesita cambios si no querés chequear el resultado):**
```ts
const toggleComplete = async (id: string, completed: boolean) => {
  await patchTodo.mutate(id, { completed });
  // Si la operación falla, `patchTodo.error` se setea y el banner persistente
  // que renderiza el error del hook lo muestra. No hace falta chequear el return.
};
```

Este es el único caso donde el código viejo sigue funcionando tal cual. Si no te importa el resultado inline y tenés un banner de error global conectado a `patchTodo.error`, no hay nada que migrar.

### Caso 3: useCreate con acceso a la entidad creada

Este es el caso que sí rompe hard: antes `useCreate` devolvía la entidad directamente, ahora devuelve el response wrapper.

**Antes:**
```ts
const handleCreate = async () => {
  try {
    const newUser = await createUser.mutate({ name, email });
    navigate(`/users/${newUser.id}`);
  } catch (err) {
    const error = err as ErrorResponse;
    showSnackbar({ message: error.message ?? 'Error', variant: 'error' });
  }
};
```

**Después:**
```ts
const handleCreate = async () => {
  const res = await createUser.mutate({ name, email });
  if (!res.success) {
    showSnackbar({ message: res.message ?? 'Error', variant: 'error' });
    return;
  }
  navigate(`/users/${res.data.id}`);
};
```

Nota que `res.data` es la entidad creada completa con `id`, `createdAt`, `updatedAt`. TypeScript la estrecha automáticamente después del `if (!res.success) return`.

### Caso 4: lectura de error codes específicos

Muchos handlers necesitan reaccionar distinto según el código de error (`STOCK_EXCEEDED`, `ALREADY_EXISTS`, etc.).

**Antes:**
```ts
try {
  await createOrder.mutate(cartData);
} catch (err) {
  const error = err as ErrorResponse;
  if (error.error?.code === 'STOCK_EXCEEDED') {
    const items = error.data?.items as OutOfStockItem[];
    showStockDialog(items);
  } else {
    showSnackbar({ message: error.message, variant: 'error' });
  }
}
```

**Después:**
```ts
const res = await createOrder.mutate(cartData);
if (!res.success) {
  if (res.error?.code === 'STOCK_EXCEEDED') {
    const items = res.data?.items as OutOfStockItem[];
    showStockDialog(items);
  } else {
    showSnackbar({ message: res.message, variant: 'error' });
  }
  return;
}
// éxito: res.data es la orden creada
```

Los campos adicionales que el backend pone fuera del contrato estándar (`items`, `retryAfter`, etc.) siguen estando en `res.data` del `ErrorResponse`, igual que antes.

### Caso 5: formularios con errores de validación por campo

Cuando el backend devuelve `validation: { email: 'El email ya existe' }`, querés mapearlo a los errores del form.

**Antes:**
```ts
const onSubmit = async (data: FormData) => {
  try {
    await createUser.mutate(data);
    reset();
    navigate('/users');
  } catch (err) {
    const error = err as ErrorResponse;
    if (error.validation) {
      Object.entries(error.validation).forEach(([field, msg]) => {
        setError(field as keyof FormData, { message: msg });
      });
    }
  }
};
```

**Después:**
```ts
const onSubmit = async (data: FormData) => {
  const res = await createUser.mutate(data);
  if (!res.success) {
    if (res.validation) {
      Object.entries(res.validation).forEach(([field, msg]) => {
        setError(field as keyof FormData, { message: msg });
      });
    }
    return;
  }
  reset();
  navigate('/users');
};
```

### Caso 6: operaciones dependientes en secuencia

Antes era común encadenar operaciones con try/catch externo, lo cual era frágil porque si una fallaba silenciosamente las siguientes seguían.

**Antes:**
```ts
try {
  await createUser.mutate(userData);
  await createProfile.mutate(profileData);
  await sendWelcomeEmail.mutate(emailData);
  showSnackbar({ message: 'Onboarding completo', variant: 'success' });
} catch (err) {
  showSnackbar({ message: 'Algo falló', variant: 'error' });
}
```

**Después:**
```ts
const userRes = await createUser.mutate(userData);
if (!userRes.success) {
  showSnackbar({ message: userRes.message, variant: 'error' });
  return;
}

const profileRes = await createProfile.mutate({ ...profileData, userId: userRes.data.id });
if (!profileRes.success) {
  showSnackbar({ message: profileRes.message, variant: 'error' });
  return;
}

const emailRes = await sendWelcomeEmail.mutate(emailData);
if (!emailRes.success) {
  // Registrar la falla pero no abortar — el usuario ya existe
  console.error('Email fallido', emailRes);
}

showSnackbar({ message: 'Onboarding completo', variant: 'success' });
```

Un beneficio del nuevo patrón es que cada fallo es explícito y podés decidir por step si abortar o seguir. También podés usar el `res.data` del paso anterior para alimentar el siguiente (ej: `userRes.data.id`).

### Caso 7: delete

`useDelete` ahora retorna `ApiResponse<void>`. La rama de éxito no tiene `data` útil, pero el check sigue siendo el mismo:

**Antes:**
```ts
try {
  await deleteTodo.mutate(id);
  showSnackbar({ message: 'Eliminado', variant: 'success' });
} catch (err) {
  showSnackbar({ message: 'No se pudo eliminar', variant: 'error' });
}
```

**Después:**
```ts
const res = await deleteTodo.mutate(id);
if (!res.success) {
  showSnackbar({ message: res.message ?? 'No se pudo eliminar', variant: 'error' });
  return;
}
showSnackbar({ message: 'Eliminado', variant: 'success' });
```

## Anti-patrones a evitar

### No leer `mutation.error` inmediatamente después del await

```ts
// ❌ MAL — closure stale
await updateTodo.mutate(id, data);
if (updateTodo.error) { /* nunca es el error nuevo */ }
```

El `updateTodo.error` leído aquí es del render anterior. El valor nuevo llega en el próximo render, después de que el handler termina. Usá siempre el return value del `mutate`.

### No re-lanzar desde un wrapper

Si tenés un wrapper que adapta las mutaciones, no re-introduzcas throws:

```ts
// ❌ MAL — recrea el bug original
async function safeUpdate(id: string, data: UpdateData) {
  const res = await updateTodo.mutate(id, data);
  if (!res.success) throw new Error(res.message);
  return res.data;
}
```

Esto rompe la invariante central. Dejá que el wrapper también retorne el `ApiResponse`:

```ts
// ✅ BIEN
async function safeUpdate(id: string, data: UpdateData): Promise<ApiResponse<Todo>> {
  // cualquier lógica extra que quieras
  return updateTodo.mutate(id, data);
}
```

### No ignorar silenciosamente el return

```ts
// ❌ MAL — estás de vuelta en el bug original
await updateTodo.mutate(id, data);
showSnackbar({ message: 'Actualizado', variant: 'success' });
```

Si no chequeás `res.success`, estás mostrando "Actualizado" incluso cuando falló. El linter puede ayudar con una regla `@typescript-eslint/no-floating-promises` y `no-unused-vars` sobre el return.

## Checklist de migración por proyecto

Para cada archivo del codebase que use mutaciones:

1. **Buscar con regex:** `await.*\.mutate\(` — esto lista todos los call sites.
2. **Por cada uno:**
   - [ ] ¿Hay un `try/catch` alrededor? Reemplazar por `if (!res.success) { ... return }`.
   - [ ] ¿Se usa el valor de retorno (`const x = await ...mutate()`)? Cambiar a `res.data` después del guard.
   - [ ] ¿Hay lectura inline de `mutation.error` post-await? Eliminar, usar `res.message` o `res.error`.
   - [ ] ¿Hay `setError` manual de React Hook Form basado en `validation`? Apuntarlo a `res.validation`.
3. **Buscar con regex:** `mutation\.error|\.mutate\s*\)\s*\n.*showSnackbar.*success` — detecta los casos donde se mostraba éxito sin chequear.
4. **Correr tests:** si los tests unitarios mockeaban `mutate: vi.fn()` sin return value, actualizarlos para que retornen un `ApiResponse`:
   ```ts
   mutate: vi.fn().mockResolvedValue({ success: true, data: mockEntity })
   ```
5. **Correr typecheck:** TypeScript va a marcar los consumers que asumían el tipo viejo. Todos los errores son de lugares donde `res` necesita un guard.

## Helper opcional: `assertSuccess`

Si tenés muchos lugares donde un fallo de mutación es realmente excepcional (por ejemplo operaciones administrativas que no pueden fallar por diseño), podés definir un helper local:

```ts
function assertSuccess<T>(
  res: ApiResponse<T>,
  context: string,
): asserts res is { success: true; data: T; message?: string } {
  if (!res.success) {
    throw new Error(`${context}: ${res.message ?? 'unknown error'}`);
  }
}

// uso
const res = await updateTodo.mutate(id, data);
assertSuccess(res, 'updateTodo');
// aquí TS sabe que res.data existe
navigate(`/todos/${res.data.id}`);
```

Este helper es del consumer, no del library. RPK intencionalmente no lanza — pero nada te impide convertir en excepción en tu borde si te conviene.

## Compatibilidad

- **v1.x → v2.0**: breaking. Requiere migración manual de los call sites.
- **RPK internamente**: el refactor preservó toda la lógica de cache (fast-path + invalidation) y global state. Solo cambia el shape del return de `mutate`. Nota: el flag `optimistic` de `GlobalStateConfig` es un no-op deprecado; el library nunca implementó true pre-request optimistic updates con rollback.
- **Consumers externos (npm público)**: el bump mayor es explícito, semantic-release publica 2.0.0 con el `BREAKING CHANGE` footer en el changelog.
- **Consumers internos (GitHub Packages)**: mismo código, mismo bump.

## Resumen en una tabla

| Hook                     | v1 return             | v2 return                    | Lanzaba en v1 | Lanza en v2 |
|--------------------------|-----------------------|------------------------------|---------------|-------------|
| `useCreate`              | `Promise<T>`          | `Promise<ApiResponse<T>>`    | Sí            | No          |
| `useUpdate`              | `Promise<void>`       | `Promise<ApiResponse<T>>`    | No            | No          |
| `usePatch`               | `Promise<void>`       | `Promise<ApiResponse<T>>`    | No            | No          |
| `useDelete`              | `Promise<void>`       | `Promise<ApiResponse<void>>` | No            | No          |
| `useSingleRecordUpdate`  | `Promise<void>`       | `Promise<ApiResponse<T>>`    | No            | No          |
| `useSingleRecordPatch`   | `Promise<void>`       | `Promise<ApiResponse<T>>`    | No            | No          |
| `useSingleRecordReset`   | `Promise<void>`       | `Promise<ApiResponse<void>>` | No            | No          |

El único hook con comportamiento runtime realmente distinto es `useCreate` — antes lanzaba, ahora no. Los otros seis solo cambiaron la firma del return (de `void` a `ApiResponse`), lo cual rompe TypeScript pero no el runtime del código existente si no se usaba el valor. El peligro oculto en esos seis es que el código de los consumers creía que manejaba errores con try/catch pero en realidad nunca los atrapó — v2 es la primera versión donde el manejo de errores post-await realmente funciona.

---

# Guía de migración v2 → v3.0.0: `ErrorResponse` discriminated union

## TL;DR

`ErrorResponse` pasó de ser una interface laxa con campos opcionales a una **discriminated union** keyed por `kind`. Cada variante tiene exactamente los campos que hacen sentido para ese tipo de error, y TypeScript fuerza narrowing antes de leerlos.

```ts
// v2 (antes)
if (!res.success) {
  if (res.error?.code === 'NOT_FOUND') showNotFound();
  if (res.validation) showFieldErrors(res.validation);
  if (res.type === 'AUTH') redirectToLogin();
}

// v3 (después)
if (!res.success) {
  switch (res.kind) {
    case 'notFound':   showNotFound(); break;
    case 'validation': showFieldErrors(res.fields); break;
    case 'auth':       redirectToLogin(); break;
    // ...
  }
}
```

Por qué el cambio: en v2, `error`, `type`, `validation` y `data` eran todos opcionales y no estaban relacionados entre sí. Leer `res.validation` sin chequear `res.type === 'VALIDATION'` compilaba sin errores pero podía devolver `undefined` silenciosamente. La discriminated union hace que TypeScript exija el guard antes de ver los campos.

## El nuevo shape

```ts
type ErrorResponse =
  | { success: false; kind: 'validation'; message: string; fields: Record<string, string>; details?: unknown }
  | { success: false; kind: 'auth';       message: string; details?: unknown }
  | { success: false; kind: 'notFound';   message: string; details?: unknown }
  | { success: false; kind: 'timeout';    message: string }
  | { success: false; kind: 'network';    message: string; details?: unknown }
  | { success: false; kind: 'http';       message: string; status: number; code?: string; details?: unknown }
  | { success: false; kind: 'unknown';    message: string; details?: unknown };

type ApiErrorKind = ErrorResponse['kind'];
```

## Mapeo mecánico de campos

| v2 field | v3 equivalent |
|----------|---------------|
| `res.message` | `res.message` (ahora **requerido** en todas las variantes) |
| `res.error?.code` | Desaparece. Para 401/403 → `res.kind === 'auth'`; para 404 → `res.kind === 'notFound'`; para códigos custom del backend → `res.kind === 'http'` con `res.code` + `res.status` |
| `res.type === 'VALIDATION'` | `res.kind === 'validation'` |
| `res.type === 'AUTH'` | `res.kind === 'auth'` |
| `res.type === 'NAVIGATION'` | `res.kind === 'notFound'` (o `http` si status ≠ 404) |
| `res.type === 'TRANSACTION'` | `res.kind === 'http'`, chequear `res.status` / `res.code` |
| `res.validation` | `res.fields` (solo existe bajo `kind: 'validation'`, y es **requerido**, no opcional) |
| `res.data` (extras del body) | `res.details` (tipo `unknown`, narrow antes de leer) |

## Cómo mapea HTTP status a `kind`

`httpErrorFromResponse` en `src/utils/errorResponse.ts` centraliza la lógica:

| Signal del backend | Resulting `kind` |
|--------------------|------------------|
| Status `401` / `403` | `auth` |
| Status `404` | `notFound` |
| Status `422`, o body con `validation` map no vacío | `validation` |
| Cualquier otro status no-ok | `http` (con `status`, `code`, `details`) |
| `AbortError` (timeout del fetch) | `timeout` |
| Fetch rejection (sin `AbortError`) | `network` |
| Excepción en mutation helpers (Zod mappers, etc.) | `unknown` |

## Casos de migración

### Caso 1: narrowing por código HTTP

**Antes (v2):**
```ts
if (!res.success) {
  if (res.error?.code === 'NOT_FOUND') return <NotFoundPage />;
  if (res.error?.code === 'UNAUTHORIZED') return redirectToLogin();
  return showGenericError(res.message);
}
```

**Después (v3):**
```ts
if (!res.success) {
  switch (res.kind) {
    case 'notFound': return <NotFoundPage />;
    case 'auth':     return redirectToLogin();
    default:         return showGenericError(res.message);
  }
}
```

### Caso 2: errores de validación por campo

**Antes (v2):**
```ts
if (!res.success && res.validation) {
  Object.entries(res.validation).forEach(([field, msg]) => {
    setError(field, { message: msg });
  });
}
```

**Después (v3):**
```ts
if (!res.success && res.kind === 'validation') {
  Object.entries(res.fields).forEach(([field, msg]) => {
    setError(field, { message: msg });
  });
}
```

Nota: en v3, `fields` es **requerido** bajo `kind: 'validation'` (no opcional), así que podés acceder directamente sin `?.`.

### Caso 3: extras del body de error

**Antes (v2):**
```ts
if (!res.success && res.error?.code === 'STOCK_EXCEEDED') {
  const items = res.data?.items as OutOfStockItem[];
  showStockDialog(items);
}
```

**Después (v3):**
```ts
if (!res.success && res.kind === 'http' && res.code === 'STOCK_EXCEEDED') {
  const items = (res.details as { items: OutOfStockItem[] }).items;
  showStockDialog(items);
}
```

`details` es `unknown` por diseño — forzás el cast explícitamente en el call site, reconociendo que es contenido backend-specific que el library no puede tipar.

### Caso 4: banner genérico de error

**Antes (v2):**
```ts
{error && <Banner type="error">{error.message ?? 'Unknown error'}</Banner>}
```

**Después (v3):**
```ts
{error && <Banner type="error">{error.message}</Banner>}
```

El `??` ya no hace falta: `message` es requerido en todas las variantes.

### Caso 5: redirect por auth

**Antes (v2):**
```ts
useEffect(() => {
  if (error?.type === 'AUTH') navigate('/login');
}, [error]);
```

**Después (v3):**
```ts
useEffect(() => {
  if (error?.kind === 'auth') navigate('/login');
}, [error]);
```

### Caso 6: exhaustividad

En v3 podés aprovechar la discriminated union para que TypeScript te avise si dejás un `kind` sin manejar:

```ts
function formatError(err: ErrorResponse): string {
  switch (err.kind) {
    case 'validation': return `Invalid: ${Object.keys(err.fields).join(', ')}`;
    case 'auth':       return 'Please sign in.';
    case 'notFound':   return 'Not found.';
    case 'timeout':    return 'Timed out.';
    case 'network':    return 'Network error.';
    case 'http':       return `HTTP ${err.status}`;
    case 'unknown':    return err.message;
    default: {
      const _exhaustive: never = err;
      return _exhaustive;
    }
  }
}
```

Si alguna vez agregamos una variante nueva al union, este switch deja de compilar hasta que la manejes.

## Search-and-replace checklist

Para migrar un codebase v2 → v3:

1. **`res.error?.code`** → revisar uno por uno. Si es un status semántico (`NOT_FOUND`, `UNAUTHORIZED`), usar `res.kind`. Si es un code custom del backend, usar `res.kind === 'http'` + `res.code`.
2. **`res.type === 'VALIDATION'`** → `res.kind === 'validation'`
3. **`res.type === 'AUTH'`** → `res.kind === 'auth'`
4. **`res.validation`** → `res.fields` (dentro de un guard `res.kind === 'validation'`)
5. **`res.data` (en error path)** → `res.details` (dentro del guard apropiado; probablemente `res.kind === 'http'`)
6. **`res.message ?? 'fallback'`** → `res.message` (ya no es opcional)
7. **Mocks de tests** que construyen `{ success: false, ... }` literales necesitan agregar `kind` y los campos requeridos de la variante. Ejemplo:
   ```ts
   // antes
   mockResolvedValue({ success: false, error: { code: 'NOT_FOUND' } })
   // después
   mockResolvedValue({ success: false, kind: 'notFound', message: 'Not found' })
   ```

## Por qué no lo hicimos retro-compatible

Las dos shapes son incompatibles. Mantener la vieja como alias forzaría todos los campos viejos a ser opcionales en el union, lo cual rompe el punto del refactor (exhaustividad + acceso seguro a campos por variante). La migración mecánica es clara y TypeScript te guía a cada call site que necesita cambios.

## Compatibilidad

- **v2.x → v3.0**: breaking. Requiere migración de todos los error-handling call sites.
- **Emisión interna**: todos los connectors, mutation helpers y utilities ahora pasan por las factories de `src/utils/errorResponse.ts`. No hay object literals de `{ success: false, ... }` dispersos en el código.
- **Bump**: v3.0.0 con `BREAKING CHANGE` footer — semantic-release lo agrega al changelog automáticamente.
