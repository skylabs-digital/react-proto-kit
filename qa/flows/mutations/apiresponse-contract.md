---
id: apiresponse-contract
type: library
category: mutations
priority: critical
start_route: /mutations
agent: qa-library-explorer
---

## Context

Validates the v2 mutation return contract end-to-end: every mutation returns
`Promise<ApiResponse<T>>`, never throws, and the response is a correctly
shaped discriminated union on both success and failure paths. This is the
single most important regression target for v2.

## Helpers

- qa/helpers/sandbox.md
- qa/helpers/library-api.md
- qa/helpers/patterns.md

## Steps

1. Navigate to `/mutations`. Clear localStorage and reload.
2. Type `QA-smoke-create` into `[data-testid="mutations-title-input"]`.
3. Click `[data-testid="mutations-create-btn"]`.
4. Read `[data-testid="mutations-last-response"]` via `browser_evaluate`.
   Parse as JSON. Assert `{ success: true, data: { id, title: "QA-smoke-create" } }`.
5. Click `[data-testid="mutations-create-invalid-btn"]` (empty title → Zod error).
6. Re-read last-response. Assert `{ success: false, error: { code: "VALIDATION", ... } }`.
7. Confirm `[data-testid="mutations-hook-error"]` banner is now visible.
8. Pick any seeded todo id (e.g., `t1`) and click `[data-testid="todo-toggle-t1"]`.
9. Re-read last-response. Assert `{ success: true, data }` again.
10. Click `[data-testid="todo-delete-t1"]`. Assert success.
11. Confirm the todo list no longer contains `todo-item-t1`.

## Assertions

- [ ] create-success returns `{ success: true, data }`
- [ ] create-invalid returns `{ success: false, error: { code: 'VALIDATION' } }`
- [ ] mutations never throw (no uncaught rejections in console)
- [ ] `hook.error` mirror matches the last error response
- [ ] after a successful mutation the list updates without manual refetch

## Test Generation

Emit tests at `qa/generated-tests/apiresponse-contract-*.generated.test.tsx`
covering, at minimum:
- one success path
- one validation-error path (nested field OK)
- one hook.error mirror assertion

Use `renderHook` with a `createWrapper()`; do not drive the browser from
the test.

## Result Schema

Standard.
