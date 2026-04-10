# Data Orchestrator Showcase

Side-by-side demo of the **hook** and **HOC** form of `useDataOrchestrator` —
the way react-proto-kit aggregates multiple resources into a single loading
state for a page.

## What you'll see

- **Hook-style orchestrator** — calls `useDataOrchestrator({ required, optional })`
  with two required resources (`users`, `products`) and one optional
  (`notifications`). Exposes `isLoading` (blocks required), `isFetching`
  (non-blocking, shows a subtle indicator), and per-resource `retry`.
- **HOC-style orchestrator** — `withDataOrchestrator(Component, { hooks })`
  wraps a component and injects an `orchestrator` prop with refetch /
  loading / errors maps. Data is passed as top-level props.
- **resetKey** — clicking the reset button bumps a counter that the hook
  orchestrator consumes as `resetKey`, which forces every resource to
  re-initialize. Useful when the page identity changes (e.g. navigating
  between records).

## Running it

No backend needed — everything runs against `LocalStorageConnector` seeded
with fallback data via `createFallbackSeedConfig`.

```bash
yarn install   # or npm install / pnpm install
yarn dev
```

Then open <http://localhost:5173>. On first load, the LocalStorage gets
seeded with 3 users, 3 products, and 2 notifications. Open DevTools →
Application → Local Storage to inspect.

## Key snippets

```tsx
// Hook form — required/optional split
const { data, isLoading, isFetching, errors, retry, retryAll } =
  useDataOrchestrator(
    {
      required: { users: usersApi.useList, products: productsApi.useList },
      optional: { notifications: notificationsApi.useList },
    },
    { resetKey }
  );

if (isLoading) return <Spinner />;
// data.users and data.products are non-null here; data.notifications may be null
```

```tsx
// HOC form — component receives resources as props + an `orchestrator` prop
const HocDashboard = withDataOrchestrator<HocDashboardData>(Inner, {
  hooks: {
    users: usersApi.useList,
    products: productsApi.useList,
  },
});
```

## Files

- [src/App.tsx](src/App.tsx)
- [src/main.tsx](src/main.tsx)
- [vite.config.ts](vite.config.ts)

## See also

- [../v2-patterns/](../v2-patterns/) — `ApiResponse<T>`, `withQuery`, and
  `useInvalidation` patterns.
- [`docs/DATA_ORCHESTRATOR.md`](../../docs/DATA_ORCHESTRATOR.md) — full
  reference for the orchestrator API.
