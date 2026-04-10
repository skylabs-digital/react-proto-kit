# Examples

Focused, compiling examples for **react-proto-kit v2.0.0**. Every app here
links directly to the local library source via a Vite alias, so editing the
library and the example at the same time works out of the box.

## Overview

| Example | Demonstrates | Backend |
|---|---|---|
| [**v2-patterns/**](./v2-patterns/) | The v2 mutation return contract, `withQuery()` propagation to mutations, `useInvalidation()`, hook `.error` mirror | LocalStorage |
| [**orchestrator-showcase/**](./orchestrator-showcase/) | `useDataOrchestrator` (hook) and `withDataOrchestrator` (HOC) side-by-side with required / optional resources and `resetKey` | LocalStorage (seeded) |
| [**todo-with-backend/**](./todo-with-backend/) | Full stack: React frontend + Express backend with in-memory storage, URL-driven filter, nested comments with `withQuery` | Express |
| [**todo-with-global-context/**](./todo-with-global-context/) | `GlobalStateProvider` pattern with cross-component state sync and nested routes | LocalStorage |
| [**todo-without-global-context/**](./todo-without-global-context/) | Hook-local state pattern (no global context), with explicit `refetch` to sync lists | LocalStorage |
| [**todo-with-tabs-example/**](./todo-with-tabs-example/) | `useUrlTabs` + `watchSearchParams` + `stale-while-revalidate` for URL-driven filters | LocalStorage |
| [**url-navigation-demo/**](./url-navigation-demo/) | Every URL-driven UI primitive: `useUrlModal`, `useUrlDrawer`, `useUrlTabs`, `useUrlStepper`, `useUrlAccordion`, `useUrlParam`, plus snackbar | None |
| [**debug-renders/**](./debug-renders/) | Render-count instrumentation and profiling against `useList` / `useById` | None |
| [seed-usage.tsx](./seed-usage.tsx) | Standalone reference for `createDevSeedConfig` / `createFallbackSeedConfig` / `createInitSeedConfig` | — |
| [simple-seed-test.tsx](./simple-seed-test.tsx) | Minimal seed pre-population smoke test | — |
| [withDataOrchestratorQueryParams.tsx](./withDataOrchestratorQueryParams.tsx) | `withDataOrchestrator` + `watchSearchParams` + `useUrlParam` for URL-reactive data | — |

## Running any example

Every app directory is a self-contained Vite project with a Vite alias that
points `@skylabs-digital/react-proto-kit` to `../../src/index.ts`, so you can
edit the library and see changes without re-linking.

```bash
cd examples/<name>
yarn install   # or npm install / pnpm install
yarn dev
```

For `todo-with-backend` start both the Vite dev server and the Express
backend:

```bash
cd examples/todo-with-backend
yarn install
yarn run install-backend
yarn start           # runs backend (3001) + frontend (5174) concurrently
```

## What's not here (and why)

If you are migrating from v1.x and are looking for files that used to live in
this folder, they were removed because they demonstrated patterns that no
longer exist in v2.0.0:

- **Standalone v1 files** (`basic-usage.tsx`, `advanced-usage.tsx`,
  `forms-usage.tsx`, `validation-example.tsx`, `fetch-connector.tsx`,
  `CustomSnackbarExample.tsx`, `global-state-example.tsx`, `patch-example.ts`,
  `nested-routes-test.ts`, `edit-form-usage.tsx`) — all used the pre-v2
  `try / catch` mutation pattern or removed APIs (`createCrudApi`,
  `useUrlSelector`, `mutateAsync`, `onSuccess` / `onError` callback props,
  positional-2 `createDomainApi` with options as the third arg). The v2
  idioms these would have shown are now in [v2-patterns/](./v2-patterns/).
- **`blog-with-global-context/`** and **`blog-without-global-context/`** —
  duplicates of the blog-with-backend scenario from v1, both stale.
- **`blog-with-backend/`** — fundamentally broken on v2 (api.ts passed
  options where the upsert schema goes, `useUpdate` was used with the id at
  the hook level, `useUrlSelector` everywhere). Rewriting it in place was
  more work than starting over, and the todo-with-backend example already
  covers the Express + FetchConnector story.

For the v1 → v2 mutation return contract migration itself, see
[`MIGRATION.md`](../MIGRATION.md) at the repo root.

## Start here if you are new

1. **[v2-patterns/](./v2-patterns/)** — the canonical one-page showcase for
   what actually changed in v2.0.0.
2. **[todo-without-global-context/](./todo-without-global-context/)** — the
   simplest CRUD loop, no global state.
3. **[orchestrator-showcase/](./orchestrator-showcase/)** — once you have
   more than one resource on a page.
4. **[todo-with-backend/](./todo-with-backend/)** — when you want to hit an
   actual HTTP backend.
