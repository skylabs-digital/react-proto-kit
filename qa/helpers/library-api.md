# react-proto-kit public API — at a glance

This is the minimal surface agents need to reason about flows. For the full
list, read `src/index.ts`. **Treat the library code as read-only** during QA.

## Factories

- `createDomainApi(path, entitySchema, upsertSchema?, config?)` — list/CRUD api.
  - Returns `{ useList, useById, useCreate, useUpdate, usePatch, useDelete, withQuery, withParams }`.
  - 3-arg form reuses `entitySchema` as upsertSchema.
- `createSingleRecordApi(path, schema, config?)` — single-record api
  (think `/me`, `/config`, `/stats`). Returns `{ useRecord, useUpdate, usePatch }`.

## Query hooks

- `useList(params?)` → `{ data, loading, error, refetch, meta? }`.
- `useById(id)` → `{ data, loading, error, refetch }`. Pass `undefined` to disable.
- `useRecord()` → `{ data, loading, error, refetch }` (single-record apis).
- `withQuery({ ...queryParams })` → returns a new api object whose list AND
  mutations include those params.
- `withParams({ path: value })` → resolves dynamic path segments.

## Mutation hooks — the v2 contract

**All mutations return `Promise<ApiResponse<T>>` and NEVER throw.**

```ts
const { mutate: createTodo, error } = todosApi.useCreate();
const res = await createTodo({ title: 'x', status: 'pending' });
if (!res.success) {
  // res.error: { code, message, fields?, data? }
  return;
}
// res.data: the created entity
```

`error` on the hook is a mirror of the last failed response — useful for
banner UI. It is always in sync with the return value.

## Orchestrator

- `useDataOrchestrator({ required, optional }, { resetKey? })` →
  `{ data, isLoading, isFetching, hasErrors, errors, retry, retryAll }`.
- `withDataOrchestrator<Data>(Component, { hooks })` — HOC form, injects an
  `orchestrator` prop with the same shape plus `refetch` / `loading` maps.

## Invalidation

- `useInvalidation()` → `{ invalidate(entity), invalidateAll() }`. Stable
  identity across renders.

## Navigation

- `useUrlParam<T>(key, default?)` → `[value, setValue]`. `setValue(null)` removes.
- `useUrlTabs<T>(key, allowed, default?)` → `[activeTab, setTab]`.
- `useUrlModal(id)` → `[isOpen, setOpen]`. `setOpen()` toggles.
- `useUrlDrawer(id)` → `[isOpen, setOpen]`. Same shape as modal.
- `useUrlStepper<T>(key, steps, default?)` → `[currentStep, helpers]`.
  Helpers: `next`, `prev`, `goTo`, `reset`, `isFirst`, `isLast`, `currentIndex`, `totalSteps`.
- `useUrlAccordion(key, { multiple? })` → tuple with helpers.

## Forms

- `useFormData<T>(schema, initialValues, options?)` →
  `{ values, errors, isDirty, isValid, touched, handleChange, handleInputChange, handleSubmit, reset, loadData, setFieldError, clearErrors, validate }`.
- `handleSubmit(onSubmit)` returns a form-event handler. `onSubmit` receives
  the parsed, valid values.

## What the agent MUST NOT assume

- No `mutateAsync`, no `.useCreate({ onSuccess, onError })` callbacks —
  those were removed in v2.
- No `useQuery(id)` — it is `useById(id)`.
- No `useUrlSelector` — it was renamed to `useUrlParam`. The old name still
  re-exports but flows should use the new name.
- No `optimistic: true` config flag — it is a deprecated no-op in v2.
