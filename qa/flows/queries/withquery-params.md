---
id: withquery-params
type: library
category: queries
priority: high
start_route: /queries
agent: qa-library-explorer
---

## Context

`withQuery({ status })` should:
1. Filter the `useList` response to matching records.
2. Trigger a new fetch (visible in network) when params change.
3. Stably memoize keys so re-renders with identical params reuse the cache.

## Helpers

- qa/helpers/sandbox.md
- qa/helpers/library-api.md

## Steps

1. Navigate to `/queries`. Clear localStorage, reload.
2. Confirm `[data-testid="queries-status-select"]` defaults to `all`.
3. Count items in `[data-testid="queries-todo-list"]` → record as `total`.
4. Change select to `pending`. Wait for the list to update.
5. Count items → should equal the number of seeded todos with `status = 'pending'`.
6. Change select to `done`. Count → should equal seeded done count.
7. Change back to `all`. Count should return to `total`.
8. Click `[data-testid="queries-refetch-btn"]` and confirm the list still
   renders without flicker (no `loading` stuck on).

## Assertions

- [ ] filter results match expected counts
- [ ] switching back to `all` restores the full list
- [ ] manual refetch does not blank the list
- [ ] no console warnings about missing query keys

## Test Generation

Generate a Vitest that calls `api.withQuery({ status: 'pending' }).useList()`
via renderHook and asserts the filtered shape.

## Result Schema

Standard.
