# v2 Patterns Showcase

A single-page example that exercises the four behaviors that changed or were
added in **react-proto-kit v2.0.0**:

1. Mutations return `Promise<ApiResponse<T>>` and **never throw** — handle
   outcomes inline with `if (!res.success) { ... }`.
2. `withQuery({ tenantId })` propagates the query params to mutations too
   (not just to list queries).
3. `useInvalidation()` gives imperative control over the cache for external
   events the library doesn't know about (websockets, refresh buttons,
   custom endpoints).
4. The hook's `.error` state mirrors the last `ErrorResponse` for persistent
   banners, while the awaited return value is the only safe way to react
   inline inside an event handler.

## What you'll see

- **Create note form** — uses the `res.success` pattern with a snackbar for
  the top-level error and a field-level banner wired to `hook.error`. Type
  the literal string `FORCE_ERROR` as the title to trigger a Zod validation
  error and see both paths.
- **Notes list** — scoped by tenant via `withQuery({ tenantId })`. Toggle
  the tenant selector to see two independently-cached lists. Both tenants
  share the same entity definition but live in separate cache slots because
  the query param changes the cache key.
- **Global refresh button** — invokes `invalidate('notes')` and
  `invalidateAll()` to force subscribed queries to refetch.

## Running it

No backend needed — everything runs against `LocalStorageConnector`.

```bash
yarn install   # or npm install / pnpm install
yarn dev
```

Open <http://localhost:5173> and try:

1. Create a note with a valid title.
2. Create a note with title `FORCE_ERROR` and observe the snackbar +
   persistent banner.
3. Switch tenant in the selector and notice that each tenant has its own
   list.
4. Click **invalidate('notes')** to force a background refetch of the list.

## Files

- [src/App.tsx](src/App.tsx) — all the demo code in one file
- [src/main.tsx](src/main.tsx) — React entry point
- [vite.config.ts](vite.config.ts) — aliases `@skylabs-digital/react-proto-kit`
  to the local source so you can edit the library and see changes immediately

## Key reference

```tsx
// 1) Mutation return contract
const res = await createNote({ title, body });
if (!res.success) {
  showSnackbar({ message: res.message, variant: 'error' });
  return;
}
// res.data is the created entity

// 2) withQuery propagates to mutations
const scopedApi = notesApi.withQuery({ tenantId });
const { mutate: createNote } = scopedApi.useCreate();
// createNote will include ?tenantId=... in the POST

// 3) Imperative invalidation
const { invalidate, invalidateAll } = useInvalidation();
invalidate('notes');     // refetch every subscribed query for this entity
invalidateAll();         // refetch everything
```
