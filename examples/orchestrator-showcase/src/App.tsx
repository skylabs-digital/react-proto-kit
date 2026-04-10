import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ApiClientProvider,
  GlobalStateProvider,
  createDomainApi,
  createFallbackSeedConfig,
  useDataOrchestrator,
  withDataOrchestrator,
  ExtractEntityType,
  z,
} from '../../../src';

/**
 * ============================================================================
 * Data Orchestrator Showcase
 * ============================================================================
 *
 * Demonstrates the real-world shape of `useDataOrchestrator` and
 * `withDataOrchestrator`:
 *
 *  - Required vs optional resources
 *  - `isLoading` (blocks the required resources) vs `isFetching` (non-blocking)
 *  - `resetKey` to force the orchestrator to re-initialize
 *  - Granular retry for a single resource
 *  - HOC form with the `orchestrator` prop injected into the wrapped component
 *
 * Everything runs against LocalStorageConnector seeded with fallback data.
 */

// ---------------------------------------------------------------------------
// Schemas + APIs
// ---------------------------------------------------------------------------

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']),
});

const productSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string(),
});

const notificationSchema = z.object({
  message: z.string(),
  level: z.enum(['info', 'warning', 'error']),
});

const usersApi = createDomainApi('users', userSchema, userSchema);
const productsApi = createDomainApi('products', productSchema, productSchema);
const notificationsApi = createDomainApi('notifications', notificationSchema, notificationSchema);

type User = ExtractEntityType<typeof usersApi>;
type Product = ExtractEntityType<typeof productsApi>;
type Notification = ExtractEntityType<typeof notificationsApi>;

// ---------------------------------------------------------------------------
// Hook-style orchestrator
// ---------------------------------------------------------------------------

function HookDashboard({ resetKey }: { resetKey: number }) {
  const { data, isLoading, isFetching, hasErrors, errors, retry, retryAll } =
    useDataOrchestrator(
      {
        required: {
          users: usersApi.useList,
          products: productsApi.useList,
        },
        optional: {
          notifications: notificationsApi.useList,
        },
      },
      { resetKey }
    );

  if (isLoading) {
    return <div style={card}>⏳ Loading required resources…</div>;
  }

  return (
    <section style={card}>
      <header style={flexBetween}>
        <h3>Hook-style orchestrator</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {isFetching && <span style={badge}>🔄 Fetching…</span>}
          <button onClick={retryAll} style={buttonSecondary}>
            retryAll()
          </button>
        </div>
      </header>

      {hasErrors && (
        <div style={errorBanner}>
          Some required resources failed. Use the per-resource retry buttons
          below to recover, or <code>retryAll()</code> to refetch everything.
        </div>
      )}

      <ResourcePanel
        label="Users"
        required
        items={data.users as User[] | null}
        error={errors.users}
        onRetry={() => retry('users')}
        render={u => `${u.name} (${u.role})`}
      />
      <ResourcePanel
        label="Products"
        required
        items={data.products as Product[] | null}
        error={errors.products}
        onRetry={() => retry('products')}
        render={p => `${p.name} — $${p.price}`}
      />
      <ResourcePanel
        label="Notifications"
        optional
        items={data.notifications as Notification[] | null}
        error={errors.notifications}
        onRetry={() => retry('notifications')}
        render={n => `[${n.level}] ${n.message}`}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// HOC-style orchestrator
// ---------------------------------------------------------------------------

interface HocDashboardData {
  users: User[];
  products: Product[];
}

type HocDashboardProps = HocDashboardData & {
  orchestrator: {
    retry: (key: 'users' | 'products') => void;
    retryAll: () => void;
    refetch: Record<'users' | 'products', () => Promise<void>>;
    loading: Record<'users' | 'products', boolean>;
    errors: Record<'users' | 'products', { success: false; message?: string } | undefined>;
    isFetching: boolean;
    isLoading: boolean;
  };
};

function HocDashboardInner({ users, products, orchestrator }: HocDashboardProps) {
  return (
    <section style={card}>
      <header style={flexBetween}>
        <h3>HOC-style orchestrator</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {orchestrator.isFetching && <span style={badge}>🔄 Fetching…</span>}
          <button onClick={orchestrator.retryAll} style={buttonSecondary}>
            retryAll()
          </button>
        </div>
      </header>

      <p style={hint}>
        The HOC injects an <code>orchestrator</code> prop with retry / refetch
        / loading / errors. Individual resources are top-level props.
      </p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h4 style={{ margin: '4px 0' }}>
            Users{' '}
            {orchestrator.loading.users && <span style={{ color: '#6b7280' }}>…</span>}
          </h4>
          <ul style={list}>
            {users.map(u => (
              <li key={u.id}>{u.name}</li>
            ))}
          </ul>
          <button onClick={() => orchestrator.retry('users')} style={buttonSmall}>
            retry('users')
          </button>
        </div>
        <div>
          <h4 style={{ margin: '4px 0' }}>
            Products{' '}
            {orchestrator.loading.products && <span style={{ color: '#6b7280' }}>…</span>}
          </h4>
          <ul style={list}>
            {products.map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
          <button onClick={() => orchestrator.retry('products')} style={buttonSmall}>
            retry('products')
          </button>
        </div>
      </div>
    </section>
  );
}

const HocDashboard = withDataOrchestrator<HocDashboardData>(HocDashboardInner as any, {
  hooks: {
    users: usersApi.useList as any,
    products: productsApi.useList as any,
  },
});

// ---------------------------------------------------------------------------
// Reusable resource panel
// ---------------------------------------------------------------------------

interface ResourcePanelProps<T> {
  label: string;
  required?: boolean;
  optional?: boolean;
  items: T[] | null;
  error?: { success: false; message?: string } | undefined;
  onRetry: () => void;
  render: (item: T) => string;
}

function ResourcePanel<T extends { id: string }>({
  label,
  required,
  optional,
  items,
  error,
  onRetry,
  render,
}: ResourcePanelProps<T>) {
  return (
    <div style={panel}>
      <div style={flexBetween}>
        <strong>
          {label} {required && <span style={pill}>required</span>}
          {optional && <span style={pillMuted}>optional</span>}
        </strong>
        <button onClick={onRetry} style={buttonSmall}>
          retry('{label.toLowerCase()}')
        </button>
      </div>
      {error && <div style={errorBanner}>❌ {error.message ?? 'Error'}</div>}
      {!error && items && items.length === 0 && (
        <p style={hint}>No items yet.</p>
      )}
      {!error && items && items.length > 0 && (
        <ul style={list}>
          {items.map(item => (
            <li key={item.id}>{render(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root with seed data
// ---------------------------------------------------------------------------

const seedConfig = createFallbackSeedConfig({
  users: [
    { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
    { id: '2', name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
    { id: '3', name: 'Grace Hopper', email: 'grace@example.com', role: 'member' },
  ],
  products: [
    { id: 'p1', name: 'Widget', price: 9.99, category: 'hardware' },
    { id: 'p2', name: 'Gizmo', price: 19.99, category: 'hardware' },
    { id: 'p3', name: 'License', price: 49.0, category: 'software' },
  ],
  notifications: [
    { id: 'n1', message: 'Welcome!', level: 'info' },
    { id: 'n2', message: 'Your trial ends soon', level: 'warning' },
  ],
});

function App() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage" config={{ seed: seedConfig }}>
        <GlobalStateProvider>
          <main style={page}>
            <header style={{ marginBottom: 16 }}>
              <h1>react-proto-kit · data orchestrator</h1>
              <p style={hint}>
                Hook and HOC form side-by-side, over LocalStorage seeded with
                fallback data. Use the reset button to force the hook
                orchestrator to re-initialize via <code>resetKey</code>.
              </p>
              <button onClick={() => setResetKey(k => k + 1)} style={button}>
                Reset hook orchestrator (resetKey = {resetKey})
              </button>
            </header>

            <HookDashboard resetKey={resetKey} />
            <HocDashboard />
          </main>
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const page: React.CSSProperties = {
  maxWidth: 820,
  margin: '0 auto',
  padding: 24,
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#fff',
};

const panel: React.CSSProperties = {
  padding: 10,
  borderTop: '1px solid #f3f4f6',
  marginTop: 10,
};

const list: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '6px 0 10px 0',
};

const flexBetween: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const hint: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  margin: '4px 0 12px 0',
};

const badge: React.CSSProperties = {
  background: '#fef3c7',
  color: '#92400e',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 12,
};

const pill: React.CSSProperties = {
  display: 'inline-block',
  background: '#dbeafe',
  color: '#1e40af',
  padding: '1px 8px',
  borderRadius: 999,
  fontSize: 11,
  marginLeft: 6,
};

const pillMuted: React.CSSProperties = {
  ...pill,
  background: '#f3f4f6',
  color: '#6b7280',
};

const button: React.CSSProperties = {
  padding: '8px 14px',
  border: 'none',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const buttonSecondary: React.CSSProperties = {
  ...button,
  background: '#e5e7eb',
  color: '#111',
};

const buttonSmall: React.CSSProperties = {
  ...buttonSecondary,
  padding: '4px 10px',
  fontSize: 12,
};

const errorBanner: React.CSSProperties = {
  padding: 10,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
  borderRadius: 6,
  fontSize: 13,
  marginTop: 6,
};
