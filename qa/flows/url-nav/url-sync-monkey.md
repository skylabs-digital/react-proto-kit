---
id: url-sync-monkey
type: library
category: url-nav
priority: medium
start_route: /url-nav
agent: qa-library-explorer
---

## Context

Monkey-test of the `useUrl*` primitives. Every piece of state surfaced to
the hooks should round-trip through `location.search`. Browser back/forward
should restore prior state. Invalid param values should never crash.

## Helpers

- qa/helpers/sandbox.md

## Steps

1. Navigate to `/url-nav`. Confirm default state (empty `q`, `tab=overview`).
2. Type `hello` into `urlnav-q-input`. Confirm `?q=hello` in URL.
3. Click each tab in order (overview → details → history). Confirm
   `?tab=<value>` updates each time.
4. Click `urlnav-modal-toggle`. Confirm `?modal=qa-modal` is set.
5. Click `urlnav-modal-close`. Confirm `modal` param removed.
6. Click `urlnav-drawer-toggle`. Confirm drawer state reflected in URL.
7. Click `urlnav-stepper-next` twice. Confirm `?step=review`. Click prev.
   Confirm `step=address`.
8. Manually navigate to `/url-nav?tab=nonsense`. Confirm `urlnav-tab-active`
   falls back to the default without console errors.
9. `browser_navigate_back` and confirm prior state restored.

## Assertions

- [ ] every stateful change round-trips through URL
- [ ] invalid tab value falls back to default (no crash)
- [ ] browser back restores prior state
- [ ] no console errors during the whole walk

## Test Generation

Generate tests at `qa/generated-tests/url-sync-monkey-*.generated.test.tsx`
for each invariant the monkey test validates.

## Result Schema

Standard.
