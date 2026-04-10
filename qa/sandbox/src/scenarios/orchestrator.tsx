import React, { useState } from 'react';
import {
  createDomainApi,
  useDataOrchestrator,
  withDataOrchestrator,
  z,
} from '@skylabs-digital/react-proto-kit';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']).optional(),
});
const productSchema = z.object({ name: z.string(), price: z.number() });
const todoSchema = z.object({
  title: z.string(),
  status: z.enum(['pending', 'done']),
});

const usersApi = createDomainApi('users', userSchema, userSchema);
const productsApi = createDomainApi('products', productSchema, productSchema);
const todosApi = createDomainApi('todos', todoSchema, todoSchema);

// Scenario: hook-form orchestrator + HOC side by side. Required vs optional
// resources, `resetKey`, per-resource retry, HOC `orchestrator` prop.
function HookPanel({ resetKey }: { resetKey: number }) {
  const { data, isLoading, isFetching, hasErrors, errors, retryAll } =
    useDataOrchestrator(
      {
        required: { users: usersApi.useList, products: productsApi.useList },
        optional: { todos: todosApi.useList },
      },
      { resetKey }
    );

  if (isLoading) {
    return <div data-testid="orch-hook-loading">loading required…</div>;
  }

  return (
    <section data-testid="orch-hook-panel" style={card}>
      <header style={flexBetween}>
        <h3>Hook orchestrator</h3>
        {isFetching && <span data-testid="orch-hook-fetching">fetching…</span>}
      </header>
      {hasErrors && (
        <p data-testid="orch-hook-has-errors" style={errorBanner}>
          some resources failed: {Object.keys(errors).join(', ')}
        </p>
      )}
      <p data-testid="orch-hook-users-count">users: {(data.users ?? []).length}</p>
      <p data-testid="orch-hook-products-count">
        products: {(data.products ?? []).length}
      </p>
      <p data-testid="orch-hook-todos-count">
        todos (optional): {data.todos ? data.todos.length : 'null'}
      </p>
      <button data-testid="orch-hook-retry-all" onClick={retryAll}>
        retryAll()
      </button>
    </section>
  );
}

interface HocData {
  users: z.infer<typeof userSchema>[];
  products: z.infer<typeof productSchema>[];
}

function HocInner({
  users,
  products,
  orchestrator,
}: HocData & {
  orchestrator: {
    retryAll: () => void;
    isFetching: boolean;
  };
}) {
  return (
    <section data-testid="orch-hoc-panel" style={card}>
      <header style={flexBetween}>
        <h3>HOC orchestrator</h3>
        {orchestrator.isFetching && <span data-testid="orch-hoc-fetching">fetching…</span>}
      </header>
      <p data-testid="orch-hoc-users-count">users: {users.length}</p>
      <p data-testid="orch-hoc-products-count">products: {products.length}</p>
      <button data-testid="orch-hoc-retry-all" onClick={orchestrator.retryAll}>
        retryAll()
      </button>
    </section>
  );
}

const HocPanel = withDataOrchestrator<HocData>(HocInner as any, {
  hooks: {
    users: usersApi.useList as any,
    products: productsApi.useList as any,
  },
});

export default function OrchestratorScenario() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <section style={{ padding: 16 }}>
      <h2>Orchestrator scenario</h2>
      <button
        data-testid="orch-reset-btn"
        onClick={() => setResetKey(k => k + 1)}
      >
        bump resetKey (= {resetKey})
      </button>
      <HookPanel resetKey={resetKey} />
      <HocPanel />
    </section>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  margin: '12px 0',
};
const flexBetween: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const errorBanner: React.CSSProperties = {
  padding: 8,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
};
