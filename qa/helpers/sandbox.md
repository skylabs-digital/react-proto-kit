# Sandbox usage guide

The sandbox is a minimal Vite app at `qa/sandbox/` that imports the library
directly from `../../src/index.ts` via alias. No build step for the library
is required — edits to `src/` are picked up on the next render.

## Boot

```bash
cd qa/sandbox
yarn install   # first run only
yarn dev       # starts on http://localhost:5180 (strictPort)
```

Port **5180** is reserved for QA. If it is already taken, stop the other
process instead of changing ports — flows hard-code the URL.

## Reset state

The sandbox persists data to `localStorage` via `LocalStorageConnector` with
a deterministic seed from `src/connectors/test-connector.ts`. To reset:

```js
// in the browser devtools console, or via Playwright browser_evaluate
localStorage.clear();
location.reload();
```

On reload, `createFallbackSeedConfig` repopulates every entity from the seed.
Tests that mutate data should always start from a clean slate.

## Scenario routes

| Path             | Feature under test                                         |
|------------------|------------------------------------------------------------|
| `/mutations`     | `useCreate` / `useUpdate` / `useDelete`, `ApiResponse<T>`  |
| `/queries`       | `useList`, `useById`, `withQuery`, refetch                 |
| `/orchestrator`  | `useDataOrchestrator`, `withDataOrchestrator`, `resetKey`  |
| `/forms`         | `useFormData` with nested field paths                      |
| `/url-nav`       | `useUrlParam`, `useUrlTabs`, `useUrlModal`, `useUrlStepper`|
| `/cache`         | `useInvalidation`, dedup, SWR                              |

Every interactive element has a `data-testid` — agents locate elements by
test id, never by raw text, to survive copy changes.

## Playwright MCP patterns

- **Navigate**: `browser_navigate({ url: 'http://localhost:5180/mutations' })`
- **Snapshot** (read DOM + test ids): `browser_snapshot()`
- **Click**: `browser_click({ selector: '[data-testid="mutations-create-btn"]' })`
- **Fill**: `browser_type({ selector: '[data-testid="mutations-title-input"]', text: 'hello' })`
- **Read response**: `browser_evaluate({ script: "document.querySelector('[data-testid=\"mutations-last-response\"]').innerText" })`
- **Console / network**: `browser_console_messages()`, `browser_network_requests()`

After each run, the agent produces a structured result object (see
`patterns.md`) that the orchestrator aggregates into the run report.
