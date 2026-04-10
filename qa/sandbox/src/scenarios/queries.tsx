import React, { useState } from 'react';
import { createDomainApi, z } from '@skylabs-digital/react-proto-kit';

const todoSchema = z.object({
  title: z.string(),
  status: z.enum(['pending', 'done']),
  tenantId: z.string().optional(),
});

const todosApi = createDomainApi('todos', todoSchema, todoSchema);

// Scenario for useList + useById + withQuery filtering. Exposes a status
// selector so flows can exercise queryParams-change-triggered refetch and
// stale-while-revalidate UI behaviour.
export default function QueriesScenario() {
  const [status, setStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [selectedId, setSelectedId] = useState<string>('t1');

  const scoped =
    status === 'all' ? todosApi : todosApi.withQuery({ status });

  const { data, loading, refetch } = scoped.useList();
  const {
    data: single,
    loading: singleLoading,
    error: singleError,
  } = todosApi.useById(selectedId);

  return (
    <section style={{ padding: 16 }}>
      <h2>Queries scenario</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <label>
          status filter:{' '}
          <select
            data-testid="queries-status-select"
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
          >
            <option value="all">all</option>
            <option value="pending">pending</option>
            <option value="done">done</option>
          </select>
        </label>
        <button data-testid="queries-refetch-btn" onClick={() => refetch()}>
          refetch()
        </button>
        <button
          data-testid="queries-force-404"
          onClick={() => setSelectedId('ghost-id-xyz')}
        >
          force 404
        </button>
      </div>

      {loading && <p data-testid="queries-list-loading">loading…</p>}
      <ul data-testid="queries-todo-list">
        {(data ?? []).map(t => (
          <li key={t.id}>
            <button
              data-testid={`queries-select-${t.id}`}
              onClick={() => setSelectedId(t.id)}
            >
              select
            </button>{' '}
            <strong>{t.title}</strong> — {t.status}
          </li>
        ))}
      </ul>

      <h3>Selected (useById: {selectedId})</h3>
      {singleLoading && <p data-testid="queries-single-loading">loading…</p>}
      {singleError && (
        <p data-testid="queries-single-error" style={{ color: '#991b1b' }}>
          {singleError.message ?? 'error'}
        </p>
      )}
      <pre data-testid="queries-single-json" style={codeBlock}>
        {JSON.stringify(single, null, 2)}
      </pre>
    </section>
  );
}

const codeBlock: React.CSSProperties = {
  background: '#0f172a',
  color: '#f8fafc',
  padding: 12,
  borderRadius: 6,
  fontSize: 12,
};
