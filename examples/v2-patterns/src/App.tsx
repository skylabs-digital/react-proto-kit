import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ApiClientProvider,
  GlobalStateProvider,
  SnackbarProvider,
  SnackbarContainer,
  createDomainApi,
  useSnackbar,
  useInvalidation,
  ExtractEntityType,
  z,
} from '../../../src';

/**
 * ============================================================================
 * v2.0.0 Patterns Showcase
 * ============================================================================
 *
 * This single-page example exercises the four behaviors that changed or were
 * added in v2.0.0:
 *
 *  1. Mutations return Promise<ApiResponse<T>> and never throw — handle
 *     outcomes inline with `if (!res.success) { ... }`.
 *  2. `withQuery({ tenantId })` propagates the query params to mutations, not
 *     just to list queries (milestone 3).
 *  3. `useInvalidation()` gives imperative control over the cache for
 *     events the library doesn't know about (websocket, refresh button, etc).
 *  4. The hook's `.error` state mirrors the last ErrorResponse for persistent
 *     banners, while the awaited return value is the only safe way to react
 *     inline in an event handler.
 *
 * Everything runs against LocalStorageConnector so no backend is required.
 * To force a failure we use a business rule in the schema — a note whose
 * title is "FORCE_ERROR" fails Zod validation before it reaches the connector.
 */

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(40, 'Title must be 40 chars or less')
    .refine(value => value !== 'FORCE_ERROR', {
      message: 'This title is reserved — used to demo error handling',
    }),
  body: z.string().min(1, 'Body is required'),
});

const notesApi = createDomainApi('notes', noteSchema, noteSchema);
type Note = ExtractEntityType<typeof notesApi>;

// ---------------------------------------------------------------------------
// 1) res.success pattern with snackbar + hook.error banner
// ---------------------------------------------------------------------------

function CreateNoteForm({ tenantId }: { tenantId: string }) {
  const { showSnackbar } = useSnackbar();
  // withQuery() returns a new api bound to the provided query params. It
  // propagates through to useList AND mutations in v2.
  const scopedApi = notesApi.withQuery({ tenantId });
  const { mutate: createNote, loading, error } = scopedApi.useCreate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // v2: mutate() never throws. Always returns Promise<ApiResponse<T>>.
    const res = await createNote({ title, body });

    if (!res.success) {
      // v3: ErrorResponse is a discriminated union. When kind === 'validation',
      // res.fields carries field-level errors; res.message is always present.
      showSnackbar({
        message: res.message,
        variant: 'error',
        duration: 4000,
      });
      return;
    }

    showSnackbar({
      message: `Created "${res.data.title}"`,
      variant: 'success',
      duration: 2500,
    });
    setTitle('');
    setBody('');
  };

  return (
    <section style={card}>
      <h3>Create note (scoped to tenant: {tenantId})</h3>
      <p style={hint}>
        Try <code>FORCE_ERROR</code> as the title to see the error path — no
        try/catch needed. The hook's <code>error</code> state mirrors the
        last response for persistent banners.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
          style={input}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={loading}
          rows={3}
          style={input}
        />
        <button type="submit" disabled={loading} style={button}>
          {loading ? 'Saving…' : 'Save'}
        </button>
      </form>

      {error && (
        <div style={errorBanner}>
          <strong>hook.error:</strong> {error.message}
          {error.kind === 'validation' && (
            <ul style={{ margin: '4px 0 0 16px' }}>
              {Object.entries(error.fields).map(([field, msg]) => (
                <li key={field}>
                  <code>{field}</code>: {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2) withQuery() propagates to useList: two tenants, two cached lists
// ---------------------------------------------------------------------------

function NoteList({ tenantId }: { tenantId: string }) {
  const scopedApi = notesApi.withQuery({ tenantId });
  const { data: notes, loading, refetch } = scopedApi.useList();
  const { mutate: deleteNote } = scopedApi.useDelete();
  const { showSnackbar } = useSnackbar();

  const handleDelete = async (note: Note) => {
    const res = await deleteNote(note.id);
    if (!res.success) {
      showSnackbar({ message: res.message ?? 'Delete failed', variant: 'error' });
      return;
    }
    showSnackbar({ message: 'Deleted', variant: 'info', duration: 2000 });
  };

  return (
    <section style={card}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3>Notes for tenant {tenantId}</h3>
        <button onClick={() => refetch()} style={buttonSecondary}>
          Refetch list
        </button>
      </header>

      {loading && <p>Loading…</p>}
      {!loading && (!notes || notes.length === 0) && <p style={hint}>No notes yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {notes?.map(note => (
          <li key={note.id} style={listItem}>
            <div>
              <strong>{note.title}</strong>
              <p style={{ margin: '2px 0 0 0', color: '#555' }}>{note.body}</p>
            </div>
            <button onClick={() => handleDelete(note)} style={buttonDanger}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3) useInvalidation() — imperative refresh without going through mutations
// ---------------------------------------------------------------------------

function GlobalRefreshButton() {
  const { invalidate, invalidateAll } = useInvalidation();
  const { showSnackbar } = useSnackbar();

  return (
    <section style={card}>
      <h3>Imperative cache invalidation</h3>
      <p style={hint}>
        Use <code>useInvalidation()</code> when an external event (websocket,
        cron refresh, custom endpoint, etc.) changes data the library doesn't
        know about. Every subscribed query refetches in the background.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            invalidate('notes');
            showSnackbar({ message: 'Invalidated entity: notes', variant: 'info' });
          }}
          style={button}
        >
          invalidate('notes')
        </button>
        <button
          onClick={() => {
            invalidateAll();
            showSnackbar({ message: 'Invalidated everything', variant: 'info' });
          }}
          style={buttonSecondary}
        >
          invalidateAll()
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function App() {
  const [tenantId, setTenantId] = useState<'acme' | 'globex'>('acme');

  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <GlobalStateProvider>
          <SnackbarProvider>
            <SnackbarContainer position="top-right" maxVisible={3} />

            <main style={page}>
              <header style={{ marginBottom: 16 }}>
                <h1>react-proto-kit · v2.0.0 patterns</h1>
                <p style={hint}>
                  Open DevTools → Application → Local Storage to see entries
                  per tenant. Switching tenant here is purely a UI toggle; the
                  library uses the query param to scope the cache.
                </p>
              </header>

              <div style={{ marginBottom: 16 }}>
                <label>
                  Tenant&nbsp;
                  <select
                    value={tenantId}
                    onChange={e => setTenantId(e.target.value as 'acme' | 'globex')}
                    style={input}
                  >
                    <option value="acme">acme</option>
                    <option value="globex">globex</option>
                  </select>
                </label>
              </div>

              <CreateNoteForm tenantId={tenantId} />
              <NoteList tenantId={tenantId} />
              <GlobalRefreshButton />
            </main>
          </SnackbarProvider>
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;

// ---------------------------------------------------------------------------
// Inline styles — kept in this file to keep the example single-file.
// ---------------------------------------------------------------------------

const page: React.CSSProperties = {
  maxWidth: 720,
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

const input: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
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

const buttonDanger: React.CSSProperties = {
  ...button,
  background: '#ef4444',
};

const listItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: 8,
  borderTop: '1px solid #f3f4f6',
};

const hint: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  margin: '4px 0 12px 0',
};

const errorBanner: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
  borderRadius: 6,
  fontSize: 13,
};
