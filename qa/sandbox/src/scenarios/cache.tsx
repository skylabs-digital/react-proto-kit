import React, { useEffect, useRef, useState } from 'react';
import {
  createDomainApi,
  useInvalidation,
  z,
} from '@skylabs-digital/react-proto-kit';

const todoSchema = z.object({
  title: z.string(),
  status: z.enum(['pending', 'done']),
  tenantId: z.string().optional(),
});

const todosApi = createDomainApi('todos', todoSchema, todoSchema);

// Scenario: cache + invalidation behaviour. Two independent `useList`
// instances render side by side so agents can verify:
//   - dedup: two concurrent hooks produce a single fetch per tick
//   - invalidate('todos') refetches all subscribers
//   - mutations invalidate the entity automatically
//   - stale-while-revalidate: previous data is visible while refetching
export default function CacheScenario() {
  const { invalidate, invalidateAll } = useInvalidation();
  const listA = todosApi.useList();
  const listB = todosApi.useList();
  const { mutate: createTodo } = todosApi.useCreate();

  const renderCountA = useRef(0);
  const renderCountB = useRef(0);
  renderCountA.current++;
  renderCountB.current++;

  const [lastAction, setLastAction] = useState<string>('(none)');

  useEffect(() => {
    // surface counts in a data attribute without causing re-render loops
    document.documentElement.dataset.listARenders = String(renderCountA.current);
    document.documentElement.dataset.listBRenders = String(renderCountB.current);
  });

  async function handleInvalidateTodos() {
    invalidate('todos');
    setLastAction('invalidate("todos")');
  }

  async function handleInvalidateAll() {
    invalidateAll();
    setLastAction('invalidateAll()');
  }

  async function handleCreate() {
    const res = await createTodo({
      title: `Cache-added ${Date.now() % 10000}`,
      status: 'pending',
    });
    setLastAction(`create → success=${res.success}`);
  }

  return (
    <section style={{ padding: 16 }}>
      <h2>Cache scenario</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button data-testid="cache-invalidate-todos" onClick={handleInvalidateTodos}>
          invalidate('todos')
        </button>
        <button data-testid="cache-invalidate-all" onClick={handleInvalidateAll}>
          invalidateAll()
        </button>
        <button data-testid="cache-create-btn" onClick={handleCreate}>
          create todo
        </button>
      </div>
      <p data-testid="cache-last-action">last action: {lastAction}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <section style={card}>
          <h3>List A</h3>
          <p data-testid="cache-list-a-loading">
            loading: {String(listA.loading)}
          </p>
          <p data-testid="cache-list-a-count">
            count: {(listA.data ?? []).length}
          </p>
          <ul data-testid="cache-list-a">
            {(listA.data ?? []).map(t => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </section>
        <section style={card}>
          <h3>List B</h3>
          <p data-testid="cache-list-b-loading">
            loading: {String(listB.loading)}
          </p>
          <p data-testid="cache-list-b-count">
            count: {(listB.data ?? []).length}
          </p>
          <ul data-testid="cache-list-b">
            {(listB.data ?? []).map(t => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
};
