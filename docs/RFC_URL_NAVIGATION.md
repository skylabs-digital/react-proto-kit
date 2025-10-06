# RFC: URL-Based Navigation Components

## Resumen Ejecutivo

Sistema completo de navegación y notificaciones UI basado en URL search params y estado local para manejar modales, tabs, steppers, accordions, drawers y snackbars de forma declarativa con:
- Persistencia en refresh y URLs compartibles (URL-based)
- Browser back/forward support inteligente
- Projection pattern para modales y snackbars
- Type-safety completo
- Hooks ergonómicos + componentes wrapper
- **Modal único** garantizado con param estandarizado
- **Drawer** localStorage-only para estado temporal sin URL pollution
- **Accordion** sin contaminar historial de navegación
- **Snackbar** estado en memoria con auto-dismiss y cola

## Quick Reference

| Componente | URL Param | Storage | Navigation Stack | Uso Principal |
|------------|-----------|---------|------------------|---------------|
| **Modal** | `?modal=<id>` | URL | ✅ pushState | Diálogos, formularios (solo uno a la vez) |
| **Tabs** | `?tab=<value>` | URL | ✅ pushState | Navegación entre secciones |
| **Stepper** | `?step=<value>` | URL | ✅ pushState | Wizards multi-paso |
| **Drawer** | - | localStorage | ❌ No URL | Filtros, sidebars temporales |
| **Accordion** | `?<param>=<ids>` | URL | ❌ replaceState | FAQ, secciones expandibles |
| **Snackbar** | - | React state | ❌ No persistencia | Notificaciones, mensajes toast |

**Cambios principales vs versión anterior**:
- ✅ Modal con param único garantiza exclusividad
- ✅ Drawer simplificado a localStorage-only (sin URL pollution)
- ✅ Accordion mantiene URL para deep-linking

## Contexto y Problema

Actualmente el estado de UI (modales, tabs) se maneja con `useState`, perdiendo estado en refresh, sin URLs compartibles y sin soporte para navegación del browser.

## Propuesta

### 1. Renaming Base Hook

**`useUrlSelector` → `useUrlParam`** (más preciso para search parameters)

### 2. Hooks a Implementar

#### `useUrlModal` (Param Estandarizado)
```tsx
// ✅ NUEVO: Un solo modal a la vez, param estandarizado "modal"
const [isOpen, setOpen] = useUrlModal('editUser', {
  onOpen: () => {},
  onClose: () => {}
});

setOpen(true);   // Agrega ?modal=editUser
setOpen(false);  // Remueve ?modal (cierra cualquier modal)
setOpen();       // Toggle

// Al abrir otro modal, cierra automáticamente el anterior
const [isCreateOpen, setCreateOpen] = useUrlModal('createUser');
setCreateOpen(true); // ?modal=createUser (cierra editUser si estaba abierto)
```

**Decisión**: Param `modal` garantiza **un solo modal abierto a la vez**
- ✅ URL más limpia: `?modal=editUser` vs `?editUser=true&createUser=true`
- ✅ Mejor UX: evita múltiples modales superpuestos
- ✅ Más fácil de razonar: siempre hay 0 o 1 modal

#### `useUrlDrawer` (localStorage-only)
```tsx
// localStorage-based (sin URL pollution, cross-tab sync)
const [isOpen, setOpen] = useUrlDrawer('filters', {
  onOpen: () => {},
  onClose: () => {}
});

setOpen(true);   // localStorage.setItem('drawer_filters', 'true')
setOpen(false);  // localStorage.removeItem('drawer_filters')
setOpen();       // Toggle
```

**Decisión**: Drawer usa SOLO localStorage
- ✅ Sin contaminar URL (mejor para filtros/sidebars temporales)
- ✅ Cross-tab sync automático
- ✅ API más simple (no opción `storage`)
- ✅ Más rápido (no hay navigation events)

#### `useUrlTabs`
```tsx
type Tab = 'profile' | 'settings' | 'billing';
const [activeTab, setTab] = useUrlTabs<Tab>(
  'tab',
  ['profile', 'settings', 'billing'],
  'profile' // optional default
);
// Validación: valores inválidos → usa default o primero
```

#### `useUrlStepper`
```tsx
const [currentStep, helpers] = useUrlStepper(
  'step',
  ['info', 'payment', 'confirm']
);

helpers.next();
helpers.prev();
helpers.goTo('payment');
helpers.isFirst;
helpers.isLast;
helpers.reset();
```

#### `useUrlAccordion`
```tsx
// Single mode
const [expanded, helpers] = useUrlAccordion('section');
helpers.expand('section1');
helpers.collapse();

// Multiple mode
const [expanded, helpers] = useUrlAccordion('sections', { multiple: true });
helpers.expand('section1');
helpers.collapse('section1');
helpers.expandAll(['s1', 's2']);
helpers.collapseAll();
```

**Decisión**: Accordion siempre usa `replaceState`
- ✅ No agrega al historial de navegación
- ✅ Útil para deep-linking a secciones específicas (FAQ, docs)
- ✅ Back button no navega entre expand/collapse
- ✅ Persiste en URL para refresh y compartir

#### `useSnackbar` (Estado Local con Auto-Dismiss)
```tsx
// Hook imperativo para mostrar notificaciones
const { showSnackbar, hideSnackbar } = useSnackbar();

// Uso básico con auto-dismiss
showSnackbar({
  message: 'Changes saved successfully',
  variant: 'success',  // 'success' | 'error' | 'warning' | 'info'
  duration: 3000      // ms, default 4000, null para no auto-dismiss
});

// Con callback al cerrar
showSnackbar({
  message: 'Error occurred',
  variant: 'error',
  duration: 5000,
  onClose: () => console.log('Snackbar closed')
});

// Sin auto-dismiss (requiere close manual)
const snackbarId = showSnackbar({
  message: 'Please confirm action',
  variant: 'warning',
  duration: null
});

// Cierre manual por ID
hideSnackbar(snackbarId);

// Componente wrapper (declarativo)
<SnackbarContainer position="top-right" maxVisible={3}>
  {/* Auto-renderiza snackbars activos */}
</SnackbarContainer>
```

**Decisión**: Snackbar usa SOLO React state (no persistencia)
- ✅ Estado efímero en memoria (no URL, no localStorage)
- ✅ Auto-dismiss con timeout configurable
- ✅ Sistema de cola para múltiples notificaciones
- ✅ Portal opcional para z-index correcto
- ✅ API imperativa (hook) + declarativa (container)
- ✅ Posición configurable (top-right, bottom-left, etc.)
- ✅ Variantes visuales (success, error, warning, info)

**Casos de uso**:
- Notificaciones de éxito/error después de mutaciones
- Mensajes toast temporales
- Feedback visual no-blocking
- Alertas contextuales de sistema

### 3. Navigation Stack Behavior

| Componente | Stack | Método | Storage | Razón |
|------------|-------|--------|---------|-------|
| Modal | ✅ Sí | pushState | URL | Navegación natural: back cierra modal |
| Tabs | ✅ Sí | pushState | URL | Navegación entre tabs es navegación real |
| Stepper | ✅ Sí | pushState | URL | Wizard steps son navegación de flujo |
| Drawer | ❌ No | - | localStorage | Estado temporal UI, no navegación |
| Accordion | ❌ No | replaceState | URL | Estado UI, útil para deep-links |
| Snackbar | ❌ No | - | React state | Notificaciones efímeras, no persistencia |

**Principio de decisión**:
- **pushState**: Cuando el usuario espera que "Back" deshaga la acción
- **replaceState**: Cuando es estado temporal de UI (no navegación conceptual)
- **localStorage**: Cuando no necesita ser compartible y evita URL pollution
- **React state**: Cuando es efímero y no necesita ninguna persistencia

### 4. Componentes Wrapper

#### `<UrlModal>` con Auto-Detection de Portal

```tsx
// Root/Layout (opcional pero recomendado)
<UrlModalsContainer />

// Modal auto-detecta si existe container
<UrlModal param="editUser">
  <EditUserModal />
</UrlModal>
// ↑ Si existe <UrlModalsContainer /> → usa portal (default)
// ↑ Si NO existe container → renderiza inline

// Override manual del comportamiento
<UrlModal param="editUser" portal={false}>
  <EditUserModal />
</UrlModal>
// ↑ Fuerza render inline aunque exista container
```

**Auto-Detection con Context**:
```tsx
// UrlModalsContainer provee context
const UrlModalsContext = createContext<boolean>(false);

export function UrlModalsContainer() {
  return (
    <UrlModalsContext.Provider value={true}>
      <div id="url-modals-portal" />
    </UrlModalsContext.Provider>
  );
}

// UrlModal detecta automáticamente
export function UrlModal({ param, portal, children }: UrlModalProps) {
  const hasContainer = useContext(UrlModalsContext);
  const shouldUsePortal = portal ?? hasContainer; // Auto-detect
  
  if (shouldUsePortal && !hasContainer) {
    console.warn(
      `<UrlModal param="${param}"> has portal=true but <UrlModalsContainer /> not found.` +
      ` Add <UrlModalsContainer /> to your root or set portal={false}.`
    );
  }
  // ...
}
```

**Props**:
```tsx
interface UrlModalProps {
  modalId: string;           // ✅ NUEVO: identifica el modal (?modal=<modalId>)
  children: React.ReactNode;
  portal?: boolean;          // Auto-detecta si no se especifica
  onOpen?: () => void;
  onClose?: () => void;
  animate?: boolean;
  unmountOnClose?: boolean;  // Default: true
  closeOnEscape?: boolean;   // Default: true
  closeOnBackdrop?: boolean; // Default: true
  className?: string;
  overlayClassName?: string;
}
```

#### `<UrlDrawer>` (renderiza inline o localStorage)

```tsx
<UrlDrawer
  param="filters"
  storage="url"          // ✅ NUEVO: 'url' | 'localStorage' (default: 'url')
  position="left"        // 'left' | 'right' | 'top' | 'bottom'
  onOpen={() => {}}
  onClose={() => {}}
  animate={true}
>
  <FiltersPanel />
</UrlDrawer>

// Variante con localStorage (sin URL pollution)
<UrlDrawer
  param="sidebar"
  storage="localStorage"  // ✅ Cross-tab sync, URL limpia
  position="left"
>
  <Sidebar />
</UrlDrawer>
```

#### `<SnackbarContainer>` con Sistema de Cola

```tsx
// Root/Layout (requerido para usar snackbars)
<SnackbarContainer 
  position="top-right"    // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxVisible={3}          // Máximo de snackbars visibles simultáneamente
  defaultDuration={4000}  // Duración default en ms (puede sobreescribirse por snackbar)
/>

// Uso imperativo con hook
function SaveButton() {
  const { showSnackbar } = useSnackbar();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSnackbar({
        message: 'Changes saved successfully!',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      showSnackbar({
        message: 'Error saving changes',
        variant: 'error',
        duration: 5000,
        onClose: () => console.log('Error dismissed')
      });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

**Características**:
- Sistema de cola automático cuando hay múltiples snackbars
- Auto-dismiss con timeout configurable por snackbar
- Cierre manual con botón close
- Variantes visuales: `success`, `error`, `warning`, `info`
- Portal rendering para z-index correcto
- Posición configurable del contenedor
- Animaciones de entrada/salida

**Props de SnackbarContainer**:
```tsx
interface SnackbarContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;                         // Default: 3
  defaultDuration?: number;                    // Default: 4000ms
  className?: string;
  SnackbarComponent?: React.ComponentType<SnackbarItemProps>;  // Custom snackbar component
}

// Para customizar el render de cada snackbar
interface SnackbarItemProps {
  snackbar: Snackbar;         // Objeto con message, variant, action, etc.
  onClose: (id: string) => void;  // Función para cerrar el snackbar
  animate?: boolean;          // Si debe animar
}
```

**API de useSnackbar**:
```tsx
interface ShowSnackbarOptions {
  message: string;                          // Texto del snackbar
  variant?: 'success' | 'error' | 'warning' | 'info';  // Default: 'info'
  duration?: number | null;                 // ms o null para no auto-dismiss
  onClose?: () => void;                     // Callback al cerrar
  action?: {                                // Botón de acción opcional
    label: string;
    onClick: () => void;
  };
}

interface UseSnackbarReturn {
  showSnackbar: (options: ShowSnackbarOptions) => string;  // Retorna ID
  hideSnackbar: (id: string) => void;                      // Cierra por ID
  hideAll: () => void;                                     // Cierra todos
}
```

#### `<UrlTabs>`, `<UrlStepper>`, `<UrlAccordion>`

```tsx
// Tabs
<UrlTabs param="tab" value="profile">
  <ProfileContent />
</UrlTabs>

// Stepper
<UrlStepper param="step" value="payment">
  <PaymentStep />
</UrlStepper>

// Accordion
<UrlAccordion param="sections" id="personal" multiple>
  <PersonalInfo />
</UrlAccordion>
```

## Ejemplos de Uso

### Ejemplo 1: Dashboard con Modal (Param Estandarizado)

```tsx
function App() {
  return (
    <>
      <UrlModalsContainer />
      <Dashboard />
    </>
  );
}

function Dashboard() {
  // ✅ NUEVO: modalId en lugar de param individual
  const [isEditOpen, setEditOpen] = useUrlModal('editUser');
  const [isCreateOpen, setCreateOpen] = useUrlModal('createUser');
  
  return (
    <div>
      <button onClick={() => setEditOpen(true)}>Edit User</button>
      <button onClick={() => setCreateOpen(true)}>Create User</button>
      
      {/* ✅ NUEVO: modalId identifica qué modal mostrar */}
      <UrlModal modalId="editUser">
        <EditUserModal />
      </UrlModal>
      
      <UrlModal modalId="createUser">
        <CreateUserModal />
      </UrlModal>
    </div>
  );
}
// URL: /dashboard?modal=editUser → solo modal editUser abierto
// URL: /dashboard?modal=createUser → solo modal createUser abierto
// ✅ Garantiza un solo modal a la vez
```

### Ejemplo 2: Settings con Tabs

```tsx
function SettingsPage() {
  const [activeTab, setTab] = useUrlTabs<'profile' | 'security'>(
    'tab',
    ['profile', 'security'],
    'profile'
  );
  
  return (
    <div>
      <nav>
        <button onClick={() => setTab('profile')}>Profile</button>
        <button onClick={() => setTab('security')}>Security</button>
      </nav>
      
      <UrlTabs param="tab" value="profile">
        <ProfileSettings />
      </UrlTabs>
      <UrlTabs param="tab" value="security">
        <SecuritySettings />
      </UrlTabs>
    </div>
  );
}
// URL: /settings?tab=security → tab activo
```

### Ejemplo 3: Checkout Wizard

```tsx
function CheckoutPage() {
  const [step, helpers] = useUrlStepper(
    'step',
    ['cart', 'shipping', 'payment', 'confirm'],
    'cart'
  );
  
  return (
    <div>
      <UrlStepper param="step" value="cart"><CartStep /></UrlStepper>
      <UrlStepper param="step" value="shipping"><ShippingStep /></UrlStepper>
      <UrlStepper param="step" value="payment"><PaymentStep /></UrlStepper>
      <UrlStepper param="step" value="confirm"><ConfirmStep /></UrlStepper>
      
      <button onClick={helpers.prev} disabled={helpers.isFirst}>Prev</button>
      <button onClick={helpers.next} disabled={helpers.isLast}>Next</button>
    </div>
  );
}
// URL: /checkout?step=payment → mantiene paso en refresh
```

### Ejemplo 4: Modal con Tabs Internos

```tsx
function UserProfile() {
  const [isEditOpen, setEditOpen] = useUrlModal('editProfile');
  
  return (
    <div>
      <button onClick={() => setEditOpen(true)}>Edit</button>
      
      {/* ✅ NUEVO: modalId en lugar de param */}
      <UrlModal modalId="editProfile">
        <EditProfileModalContent />
      </UrlModal>
    </div>
  );
}

function EditProfileModalContent() {
  const [tab, setTab] = useUrlTabs('profileTab', ['basic', 'avatar'], 'basic');
  
  return (
    <div>
      <button onClick={() => setTab('basic')}>Basic</button>
      <button onClick={() => setTab('avatar')}>Avatar</button>
      
      <UrlTabs param="profileTab" value="basic"><BasicForm /></UrlTabs>
      <UrlTabs param="profileTab" value="avatar"><AvatarUpload /></UrlTabs>
    </div>
  );
}
// URL: /profile?modal=editProfile&profileTab=avatar
// Back: avatar → basic → cierra modal
// ✅ Solo un modal puede estar abierto a la vez
```

### Ejemplo 5: Drawer con localStorage (Sin URL Pollution)

```tsx
function ProductPage() {
  // ✅ localStorage: estado temporal, sin ensuciar URL
  const [isFiltersOpen, setFiltersOpen] = useUrlDrawer('filters', {
    storage: 'localStorage'
  });
  
  return (
    <div>
      <button onClick={() => setFiltersOpen(true)}>Filters</button>
      
      <UrlDrawer 
        param="filters" 
        storage="localStorage"
        position="left"
      >
        <FiltersPanel />
      </UrlDrawer>
      
      <ProductList />
    </div>
  );
}
// ✅ URL permanece limpia: /products
// ✅ Estado persiste en localStorage
// ✅ Sincroniza entre tabs del mismo origen
```

### Ejemplo 6: Snackbars con CRUD Operations

```tsx
function App() {
  return (
    <>
      <SnackbarContainer position="top-right" maxVisible={3} />
      <TodosPage />
    </>
  );
}

function TodosPage() {
  const { showSnackbar } = useSnackbar();
  const todosApi = createDomainApi('todos', todoSchema);
  
  const createMutation = todosApi.useCreate({
    onSuccess: () => {
      showSnackbar({
        message: 'Todo created successfully!',
        variant: 'success',
        duration: 3000
      });
    },
    onError: (error) => {
      showSnackbar({
        message: `Error: ${error.message}`,
        variant: 'error',
        duration: 5000
      });
    }
  });
  
  const deleteMutation = todosApi.useDelete({
    onSuccess: () => {
      showSnackbar({
        message: 'Todo deleted',
        variant: 'info',
        duration: 2000
      });
    }
  });
  
  const handleCreate = () => {
    createMutation.mutate({ text: 'New todo' });
  };
  
  const handleDeleteWithConfirm = (id: string) => {
    const snackbarId = showSnackbar({
      message: 'Delete this todo?',
      variant: 'warning',
      duration: null, // No auto-dismiss
      action: {
        label: 'Undo',
        onClick: () => {
          showSnackbar({
            message: 'Deletion cancelled',
            variant: 'info'
          });
        }
      }
    });
    
    // Auto-delete después de 5s si no cancela
    setTimeout(() => {
      deleteMutation.mutate(id);
    }, 5000);
  };
  
  return (
    <div>
      <button onClick={handleCreate}>Add Todo</button>
      {/* Lista de todos con botón delete */}
    </div>
  );
}
// ✅ Notificaciones no bloquean UI
// ✅ Sistema de cola maneja múltiples notificaciones
// ✅ Sin persistencia (estado efímero)
```

## Decisiones de Diseño

### ✅ Modal con Param Estandarizado

**Decisión**: Usar `?modal=<modalId>` en lugar de `?<modalId>=true`

**Razones**:
1. **Garantía de exclusividad**: Solo un modal abierto a la vez
2. **URL más limpia**: `?modal=editUser` vs `?editUser=true&createUser=true`
3. **Mejor UX**: Evita múltiples modales superpuestos accidentales
4. **Más fácil de razonar**: Siempre hay 0 o 1 modal

**Implementación**:
```tsx
const [isOpen, setOpen] = useUrlModal('editUser');
// setOpen(true) → ?modal=editUser
// setOpen(false) → borra ?modal

// Al abrir otro modal, cierra el anterior automáticamente
const [isOpen2, setOpen2] = useUrlModal('createUser');
// setOpen2(true) → ?modal=createUser (cierra editUser)
```

### ✅ Drawer Sin Navigation Stack

**Decisión**: Drawer usa `replaceState` en lugar de `pushState`

**Razones**:
1. **No es navegación conceptual**: Abrir/cerrar filtros no es "navegar"
2. **Evita contaminar historial**: Back button no debería cerrar drawer
3. **Consistente con otros UI states**: Igual que accordion

**Opción localStorage**:
- Para drawers que son puro estado temporal de UI
- Evita completamente URL pollution
- Cross-tab sync automático con storage events
- Default: `storage: 'url'` (backward compatible)

### ✅ Validación y Defaults

Para Tabs/Stepper:
- Valor inválido en URL → usa default o primer elemento
- Console warning en desarrollo

### ✅ Preservation de Query Params

Todos los hooks preservan otros query params automáticamente.

### ✅ Type Safety

```tsx
type Tab = 'profile' | 'settings' | 'billing';
const [tab, setTab] = useUrlTabs<Tab>('tab', ['profile', 'settings', 'billing']);
// tab: 'profile' | 'settings' | 'billing'
```

### ✅ Auto-Detection de Portal Pattern

- **Modales**: Auto-detectan si existe `<UrlModalsContainer />` en el árbol
  - Con container → `portal=true` por defecto (z-index correcto)
  - Sin container → `portal=false` por defecto (inline)
  - Override manual siempre posible: `portal={true|false}`
  - Warning si `portal=true` pero no hay container
- **Drawers**: Render inline siempre (no usan portal)
- **Snackbars**: Siempre usan portal via `<SnackbarContainer />` (requerido)

### ✅ Snackbars con Estado Efímero

**Decisión**: Usar SOLO React state (no URL, no localStorage)

**Razones**:
1. **Notificaciones son efímeras**: No necesitan persistir en refresh
2. **No son navegación**: No tiene sentido en URL o back button
3. **Sistema de cola**: Múltiples snackbars activos simultáneamente
4. **Auto-dismiss**: Timeout automático descarta la persistencia
5. **API imperativa**: `showSnackbar()` es más natural que declarativo

**Arquitectura**:
```tsx
// Context provider con estado global
const SnackbarContext = createContext<SnackbarContextValue>(null);

export function SnackbarProvider({ children }) {
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);
  
  const showSnackbar = (options) => {
    const id = generateId();
    setSnackbars(prev => [...prev, { id, ...options }]);
    
    // Auto-dismiss si tiene duration
    if (options.duration) {
      setTimeout(() => hideSnackbar(id), options.duration);
    }
    
    return id;
  };
  
  // ...
}

// Hook accede al context
export function useSnackbar() {
  return useContext(SnackbarContext);
}

// Container renderiza via portal
export function SnackbarContainer() {
  const { snackbars } = useSnackbar();
  return createPortal(
    <div className="snackbars-container">
      {snackbars.map(snackbar => (
        <SnackbarItem key={snackbar.id} {...snackbar} />
      ))}
    </div>,
    document.body
  );
}
```

**Integración con createDomainApi**:
```tsx
// Snackbars se integran perfectamente con mutation hooks
const todosApi = createDomainApi('todos', todoSchema);

const { showSnackbar } = useSnackbar();
const createMutation = todosApi.useCreate({
  onSuccess: () => showSnackbar({ message: 'Created!', variant: 'success' }),
  onError: (e) => showSnackbar({ message: e.message, variant: 'error' })
});
```

### ✅ Callbacks Opcionales

Todos los componentes soportan `onOpen`, `onClose`, etc.

### ✅ Animaciones Opcionales

Props `animate={true}` con soporte para diferentes tipos.

## Implementación

### Estructura de Archivos

```
src/navigation/
  useUrlParam.ts              # Renombrado de useUrlSelector
  useUrlModal.ts
  useUrlDrawer.ts
  useUrlTabs.ts
  useUrlStepper.ts
  useUrlAccordion.ts
  useSnackbar.ts              # ✅ NUEVO: Hook para snackbars
  components/
    UrlModal.tsx
    UrlModalsContainer.tsx
    UrlDrawer.tsx
    UrlTabs.tsx
    UrlStepper.tsx
    UrlAccordion.tsx
    SnackbarContainer.tsx     # ✅ NUEVO: Container con portal
    SnackbarItem.tsx          # ✅ NUEVO: Item individual
  context/
    SnackbarContext.tsx       # ✅ NUEVO: Context provider
  utils/
    navigationHelpers.ts      # pushState/replaceState logic
  index.ts
```

### Navigation Helpers (Core)

```tsx
export function pushToStack(param: string, value?: string) {
  const params = new URLSearchParams(window.location.search);
  value ? params.set(param, value) : params.set(param, '');
  
  const url = `${window.location.pathname}?${params}${window.location.hash}`;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function replaceState(param: string, value?: string) {
  const params = new URLSearchParams(window.location.search);
  value ? params.set(param, value) : params.set(param, '');
  
  const url = `${window.location.pathname}?${params}${window.location.hash}`;
  window.history.replaceState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function removeParam(param: string, useStack = true) {
  const params = new URLSearchParams(window.location.search);
  params.delete(param);
  
  const url = `${window.location.pathname}?${params}${window.location.hash}`;
  const method = useStack ? 'pushState' : 'replaceState';
  window.history[method]({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
```

## Plan de Implementación

### Fase 1: Core Infrastructure
1. ✅ Renombrar `useUrlSelector` → `useUrlParam`
2. 🔄 Implementar navigation helpers
3. 🔄 Crear hooks base: `useUrlModal`, `useUrlDrawer`, `useUrlTabs`

### Fase 2: Advanced Hooks
4. Implementar `useUrlStepper`
5. Implementar `useUrlAccordion`
6. Tests unitarios para todos los hooks

### Fase 3: Components
7. Implementar `<UrlModal>` + `<UrlModalsContainer>`
8. Implementar `<UrlDrawer>`
9. Implementar `<UrlTabs>`, `<UrlStepper>`, `<UrlAccordion>`

### Fase 4: Polish
10. Agregar animaciones
11. Crear ejemplos completos
12. Documentación en README
13. Tests end-to-end

## Decisiones Finales

### ✅ Portal Auto-Detection
- `<UrlModal>` detecta automáticamente presencia de `<UrlModalsContainer />` via Context
- Default: `portal = hasContainer`
- Console warning si `portal=true` pero container no existe
- Previene errores comunes y mejora DX

### ✅ Modal Único con Param Estandarizado
- Param `modal` garantiza un solo modal abierto a la vez
- Mejor UX y URLs más limpias
- Cierre automático de modales previos al abrir uno nuevo

### ✅ Drawer y Accordion con replaceState
- No agregan al navigation stack (evitan contaminar historial)
- Drawer con opción `storage: 'localStorage'` para evitar URL pollution
- Accordion siempre en URL para deep-linking (FAQ, docs)

## Preguntas Abiertas

1. **Animaciones**: ¿Usar biblioteca específica (framer-motion) o CSS puro?
   - **Recomendación**: CSS puro con classes condicionales para mantener bundle size pequeño
2. **Accessibility**: ¿Focus management automático en modales (focus trap, restore on close)?
   - **Recomendación**: Sí, con `react-focus-lock` opcional
3. **Keyboard shortcuts**: ¿Soporte para shortcuts globales (ej. ESC para cerrar último modal)?
   - **Recomendación**: Sí, ESC por defecto (deshabilitarlo con prop)

## Resumen de Cambios vs Versión Anterior

### 🆕 Modal con Param Estandarizado
| Antes | Después |
|-------|---------|
| `?editUser=true` | `?modal=editUser` |
| Múltiples modales posibles | Solo un modal a la vez ✅ |
| `useUrlModal('editUser')` | `useUrlModal('editUser')` (igual API) |
| `<UrlModal param="editUser">` | `<UrlModal modalId="editUser">` |

### 🆕 Drawer Sin Navigation Stack
| Antes | Después |
|-------|---------|
| `pushState` (agrega al historial) | `replaceState` (no agrega) ✅ |
| Solo URL | URL o localStorage |
| Back cierra drawer | Back NO cierra drawer ✅ |

### 🆕 Drawer con localStorage
```tsx
// NUEVO: Opción localStorage
useUrlDrawer('filters', { storage: 'localStorage' })

// URL permanece limpia, cross-tab sync automático
```

### ✅ Sin Cambios
- **Tabs**, **Stepper**, **Accordion**: API sin cambios
- **Type safety**: Mantiene tipado completo
- **Portal auto-detection**: Funciona igual
- **Callbacks**: `onOpen`, `onClose` sin cambios

## Estado del RFC

**Estado**: ✅ Aprobado con Cambios

**Cambios principales**:
1. Modal usa param estandarizado `?modal=<id>` para garantizar exclusividad
2. Drawer usa `replaceState` + opción `localStorage`
3. Tabla de navigation stack actualizada con Storage column

**Autor**: React Proto Kit Team  
**Fecha**: 2025-10-02 (actualizado)
**Fecha Original**: 2025-10-01

---

## Apéndice: Firmas TypeScript Completas

```tsx
// useUrlParam (renombrado)
export function useUrlParam<T = string>(
  name: string,
  transform?: (value: string) => T,
  options?: { multiple?: boolean }
): readonly [T | T[] | undefined, (newValue?: T | T[] | null) => void];

// useUrlModal (param estandarizado)
export function useUrlModal(
  modalId: string,  // ✅ Identifica el modal, se usa ?modal=<modalId>
  options?: { 
    onOpen?: () => void; 
    onClose?: () => void;
  }
): readonly [boolean, (value?: boolean) => void];

// useUrlDrawer (con opciones de storage)
export function useUrlDrawer(
  param: string,
  options?: { 
    storage?: 'url' | 'localStorage';  // ✅ Default: 'url'
    onOpen?: () => void; 
    onClose?: () => void;
  }
): readonly [boolean, (value?: boolean) => void];

// useUrlTabs
export function useUrlTabs<T extends string = string>(
  param: string,
  allowedValues: readonly T[],
  defaultValue?: T
): readonly [T, (value: T) => void];

// useUrlStepper
export function useUrlStepper<T extends string = string>(
  param: string,
  steps: readonly T[],
  defaultStep?: T
): readonly [
  T,
  {
    next: () => void;
    prev: () => void;
    goTo: (step: T) => void;
    reset: () => void;
    isFirst: boolean;
    isLast: boolean;
    currentIndex: number;
    totalSteps: number;
  }
];

// useUrlAccordion (single)
export function useUrlAccordion(
  param: string,
  options?: { multiple?: false }
): readonly [
  string | undefined,
  {
    expand: (id: string) => void;
    collapse: () => void;
    toggle: (id: string) => void;
  }
];

// useUrlAccordion (multiple)
export function useUrlAccordion(
  param: string,
  options: { multiple: true }
): readonly [
  string[] | undefined,
  {
    expand: (id: string) => void;
    collapse: (id: string) => void;
    expandAll: (ids: string[]) => void;
    collapseAll: () => void;
    toggle: (id: string) => void;
  }
];
```
