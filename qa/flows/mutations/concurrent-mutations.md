---
id: concurrent-mutations
type: library
category: mutations
priority: high
start_route: /mutations
agent: qa-library-explorer
---

## Context

Two mutations fired in the same tick (create + create, or create + update)
must both resolve with correct ApiResponse shapes and leave the list in a
consistent state. Race conditions around the optimistic cache path have
caused drift historically — this flow guards against that.

## Helpers

- qa/helpers/sandbox.md

## Steps

1. Navigate to `/mutations`, clear localStorage, reload.
2. Record the initial todo count from `[data-testid="mutations-todo-list"]`.
3. Fire two create actions back-to-back via `browser_evaluate`:
   ```js
   const btn = document.querySelector('[data-testid="mutations-create-btn"]');
   btn.click(); btn.click();
   ```
4. Wait 500ms (`browser_wait_for` with a predicate that the list grew by 2).
5. Assert list length == initial + 2.
6. Read `mutations-last-response` — must be `{ success: true, ... }`.
7. Read `browser_console_messages` — zero errors.

## Assertions

- [ ] both creates succeed
- [ ] list length reflects both new records
- [ ] no race-induced console warnings
- [ ] no duplicate IDs in the list

## Test Generation

Generate a Vitest that calls `mutate` twice inside a single `act()` block
and asserts both responses succeed and cache reflects both writes.

## Result Schema

Standard.
