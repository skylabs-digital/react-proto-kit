---
id: apiresponse-discriminated-union
type: contract-audit
category: contract
priority: critical
target: src/types/index.ts
agent: qa-contract-auditor
---

## Context

Verify that `ApiResponse<T>` is a properly discriminated union at runtime:
`success: true` and `success: false` are mutually exclusive, the error
variant always carries `error.code` + `error.message`, and the success
variant always carries `data`.

Every mutation hook must honour this contract, including on network error
paths (`createFailingConnectorWrapper` pattern from
`src/test/factory/mutation-return-contract.test.tsx`).

## Call sites to audit

- `useCreate().mutate(...)` — success + validation + network fail
- `useUpdate().mutate(id, ...)` — success + validation + network fail
- `usePatch().mutate(id, ...)` — success + network fail
- `useDelete().mutate(id)` — success + network fail
- `useRecord().mutate(...)` from `createSingleRecordApi` — success + fail

## Assertions

For each call site:
- [ ] success path: `{ success: true, data: T }` with no `error` key
- [ ] validation path: `{ success: false, error: { code: 'VALIDATION', message, fields? } }`
- [ ] network fail path: `{ success: false, error: { code: 'UNKNOWN_ERROR', message } }`
- [ ] the hook `.error` mirror matches the last failed response

## Test Generation

Emit one audit test per call site:
`qa/generated-tests/apiresponse-union-{hook}.generated.test.tsx`. Use the
failing-connector wrapper pattern already used in factory tests.

## Result Schema

Standard.
