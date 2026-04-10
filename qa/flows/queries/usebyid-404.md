---
id: usebyid-404
type: library
category: queries
priority: medium
start_route: /queries
agent: qa-library-explorer
---

## Context

`useById` against a non-existent id should resolve to an `error` response
(not throw, not hang). The sandbox `/queries` page exposes a selector that
lets us select arbitrary ids, including missing ones.

## Helpers

- qa/helpers/sandbox.md

## Steps

1. Navigate to `/queries`, clear localStorage, reload.
2. `browser_evaluate({ script: "history.replaceState(null, '', '/queries?selected=does-not-exist');" })`
   is not wired — instead, inject selection via the app state by running:
   ```js
   // use the first select button then manually overwrite the state via a
   // custom event. If the app does not expose one, fall back to clicking
   // the first todo and asserting success as a baseline.
   ```
3. Pick the first seeded todo, click its select button, confirm
   `[data-testid="queries-single-json"]` renders its data.
4. Run `browser_evaluate` to call `localStorage.removeItem('todos')` and
   reload — all todos are now gone.
5. After reload, click a previously-selected id (it still exists in the
   scenario default state `t1`).
6. Confirm `[data-testid="queries-single-error"]` is visible and contains
   a non-empty message. `[data-testid="queries-single-json"]` should be
   `null` or an empty object — either is acceptable, but not stale data.

## Assertions

- [ ] the 404 path shows an error, not stale data
- [ ] no console `unhandled rejection` entries
- [ ] re-seeding (reload) restores the normal flow

## Test Generation

Generate a Vitest that uses a `LocalStorageConnector` seeded with an empty
`todos` table and verifies `useById('nope')` resolves with an error
response.

## Result Schema

Standard.
