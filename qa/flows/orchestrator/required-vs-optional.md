---
id: required-vs-optional
type: library
category: orchestrator
priority: high
start_route: /orchestrator
agent: qa-library-explorer
---

## Context

`useDataOrchestrator` splits hooks into `required` and `optional` sets.
`isLoading` should stay `true` until every *required* resource has resolved,
while optional resources may still be loading in the background (`isFetching`).
Optional resources may also return null without failing the page.

## Helpers

- qa/helpers/sandbox.md
- qa/helpers/library-api.md

## Steps

1. Navigate to `/orchestrator`, clear localStorage, reload.
2. Confirm the "loading required…" sentinel appears briefly OR the hook
   panel is already mounted (the order is timing-dependent but both are OK).
3. Confirm `[data-testid="orch-hook-users-count"]` and `orch-hook-products-count`
   show the seeded counts (2 and 2 from the seed).
4. Confirm `[data-testid="orch-hook-todos-count"]` shows a number (the
   seeded value, 3) — not "null".
5. Click `[data-testid="orch-reset-btn"]`. The `resetKey` badge should
   bump, and the panel should re-render (brief loading state).
6. Confirm the HOC panel (`orch-hoc-panel`) also renders its users and
   products counts matching the hook panel.

## Assertions

- [ ] required resources populate counts
- [ ] optional resource never shows `null` after fetch completes
- [ ] `resetKey` re-triggers the orchestrator
- [ ] HOC and hook panels show the same numbers

## Test Generation

Vitest for the hook form with one required and one optional hook, asserting
`isLoading` is `false` once the required one resolves even if the optional
is still pending.

## Result Schema

Standard.
