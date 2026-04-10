---
id: public-api-smoke
type: library
category: smoke
priority: critical
start_route: /
agent: qa-library-explorer
---

## Context

Touch every scenario route in order and confirm the sandbox renders without
console errors, uncaught promises, or 404s. This is the fastest signal that
the library still imports and mounts cleanly after a change.

## Helpers

- qa/helpers/sandbox.md
- qa/helpers/library-api.md

## Steps

1. `browser_navigate` to `/`.
2. `browser_evaluate({ script: "localStorage.clear(); location.reload();" })` — reset state.
3. Snapshot and confirm `[data-testid="nav-root"]` is present.
4. For each route in [`/mutations`, `/queries`, `/orchestrator`, `/forms`, `/url-nav`, `/cache`]:
   a. Click the matching `[data-testid="nav-<name>"]` link.
   b. Snapshot and confirm a scenario heading (`h2`) is present.
   c. Read `browser_console_messages` — collect any `error` or `warning`
      level messages.
   d. Read `browser_network_requests` — confirm no request returned
      a status >= 400.
5. Return to `/` and confirm the home list still shows every link.

## Assertions

- [ ] every route mounts without throwing
- [ ] zero console errors across the whole tour
- [ ] zero failing network requests
- [ ] every scenario has a `scenario-root` test id

## Test Generation

If a route fails to mount OR emits a console error, emit a minimal Vitest
that renders the scenario component directly via a `createWrapper()` and
asserts it does not throw. File name:
`qa/generated-tests/public-api-smoke-{scenario-name}.generated.test.tsx`.

## Result Schema

Standard (see qa/helpers/patterns.md).
