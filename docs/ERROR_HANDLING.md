# 🛡️ Error Handling Guide

> Discriminated error union for exhaustive, type-safe handling of API failures.

---

## Overview

React Proto Kit surfaces failures as an `ErrorResponse` that is a **discriminated union** keyed by `kind`. Every connector, mutation, and query hook routes errors through the same set of factories in `src/utils/errorResponse.ts`, so consumers can narrow a single field (`res.kind`) and get fully-typed access to the variant-specific data.

> ⚠️ **v3.0.0 breaking change.** The old shape (`error: { code }`, `type`, `validation`, `data`) was replaced with a discriminated union. See [MIGRATION.md](../MIGRATION.md) for the mechanical mapping.

---

## ErrorResponse Shape

```ts
type ErrorResponse =
  | { success: false; kind: 'validation'; message: string; fields: Record<string, string>; details?: unknown }
  | { success: false; kind: 'auth';       message: string; details?: unknown }
  | { success: false; kind: 'notFound';   message: string; details?: unknown }
  | { success: false; kind: 'timeout';    message: string }
  | { success: false; kind: 'network';    message: string; details?: unknown }
  | { success: false; kind: 'http';       message: string; status: number; code?: string; details?: unknown }
  | { success: false; kind: 'unknown';    message: string; details?: unknown };

type ApiErrorKind = ErrorResponse['kind'];
```

| `kind` | When it fires | Notable fields |
|--------|---------------|----------------|
| `validation` | Client-side Zod failure **or** backend `422` / body `validation` map | `fields: Record<string, string>` |
| `auth` | HTTP `401` / `403` | `details` |
| `notFound` | HTTP `404` or localStorage lookup miss | `details` |
| `timeout` | `AbortError` from `FetchConnector` | — |
| `network` | Connector rejection that is not a timeout | `details` |
| `http` | Any other non-OK HTTP (5xx, 409, custom business codes) | `status`, `code`, `details` |
| `unknown` | Anything thrown inside mutation helpers / Zod mappers | `details` (original error) |

### How `details` is populated

`httpErrorFromResponse` extracts `message`, `code`, and `validation` from the backend body, then puts everything else under `details`. The shape is `unknown` on purpose — narrow it at the call site.

```
Backend body:
{
  "message": "Stock exceeded",
  "code": "STOCK_EXCEEDED",
  "items": [{ "productId": "p1", "requested": 5, "available": 2 }],
  "orderId": "order-123"
}

Resulting ErrorResponse (kind: 'http'):
{
  success: false,
  kind: 'http',
  status: 409,
  message: 'Stock exceeded',
  code: 'STOCK_EXCEEDED',
  details: {
    items: [{ productId: 'p1', requested: 5, available: 2 }],
    orderId: 'order-123',
  },
}
```

> 💡 If the body only contains the known fields, `details` is `undefined`.

---

## Usage Patterns

### 🔹 Basic Error Handling

All mutation hooks expose an `error` property of type `ErrorResponse | null`:

```tsx
function CreateTodoButton() {
  const { mutate, loading, error } = todoApi.useCreate();

  return (
    <div>
      <button onClick={() => mutate({ text: 'New todo', completed: false })} disabled={loading}>
        {loading ? 'Creating...' : 'Create Todo'}
      </button>
      {error && <p className="error">❌ {error.message}</p>}
    </div>
  );
}
```

### 🔹 Handling the `ApiResponse` return value

Mutation hooks never throw. They resolve to a discriminated `ApiResponse<T>` — a union of `{ success: true, data }` and `ErrorResponse`. Handle the outcome inline after `await mutate(...)`; the hook's `.error` state is still updated so persistent banners keep working.

```tsx
const { mutate: createOrder } = orderApi.useCreate();

const handleCheckout = async (checkoutData: CheckoutInput) => {
  const res = await createOrder(checkoutData);

  if (res.success) {
    navigate(`/orders/${res.data.id}`);
    return;
  }

  switch (res.kind) {
    case 'http': {
      if (res.code === 'STOCK_EXCEEDED') {
        const items = (res.details as { items: StockExceededItem[] }).items;
        showStockDialog(items);
        break;
      }
      showGenericError(res.message);
      break;
    }

    case 'validation':
      Object.entries(res.fields).forEach(([field, msg]) => {
        setFieldError(field, msg);
      });
      break;

    case 'auth':
      navigate('/login');
      break;

    case 'notFound':
      showNotFoundPage();
      break;

    case 'timeout':
    case 'network':
      showRetryDialog(res.message);
      break;

    case 'unknown':
      showGenericError(res.message);
      break;
  }
};
```

> 💡 **Why not `try/catch`?** Reading `mutation.error` immediately after `await mutate(...)` would return the **previous** render's state because the state update is still pending. Returning the response from `mutate` is the only reliable way to react inline. The hook's `.error` state is still valid for rendering persistent banners further down the tree.

### 🔹 Validation Errors

When Zod schema validation fails on the client — or when a backend responds with a `validation` map — the ErrorResponse comes back as `kind: 'validation'` with field-level details on `fields`:

```tsx
const { mutate, error } = todoApi.useCreate();

// If input fails schema validation:
// error = {
//   success: false,
//   kind: 'validation',
//   message: 'Validation failed',
//   fields: {
//     "text": "String must contain at least 1 character(s)",
//     "priority": "Invalid enum value"
//   }
// }

{error?.kind === 'validation' && (
  <ul className="validation-errors">
    {Object.entries(error.fields).map(([field, msg]) => (
      <li key={field}>
        <strong>{field}:</strong> {msg}
      </li>
    ))}
  </ul>
)}
```

### 🔹 Auth Errors

```tsx
const { error } = todoApi.useCreate();

if (error?.kind === 'auth') {
  navigate('/login');
}
```

### 🔹 Using with Snackbar

```tsx
import { useSnackbar } from '@skylabs-digital/react-proto-kit';

function OrderButton({ data }: { data: OrderInput }) {
  const { mutate } = orderApi.useCreate();
  const { showSnackbar } = useSnackbar();

  const handleClick = async () => {
    const res = await mutate(data);
    if (!res.success) {
      showSnackbar({
        message: res.message,
        variant: 'error',
        duration: 5000,
      });
      return;
    }
    showSnackbar({ message: '✅ Order placed!', variant: 'success' });
  };

  return <button onClick={handleClick}>Place Order</button>;
}
```

### 🔹 Exhaustive narrowing helper

Since `kind` is a closed union, TypeScript can enforce exhaustive handling:

```ts
function formatApiError(err: ErrorResponse): string {
  switch (err.kind) {
    case 'validation': return `Invalid: ${Object.keys(err.fields).join(', ')}`;
    case 'auth':       return 'Please sign in again.';
    case 'notFound':   return 'Resource not found.';
    case 'timeout':    return 'Request timed out.';
    case 'network':    return 'Network error. Check your connection.';
    case 'http':       return `HTTP ${err.status}: ${err.message}`;
    case 'unknown':    return err.message;
    default: {
      const _exhaustive: never = err;
      return _exhaustive;
    }
  }
}
```

---

## Backend Contract

For the `details` field to work, your backend should return error responses as JSON with at least a `message` field. Any additional fields will be preserved under `details`:

```javascript
// Express.js example — stock exceeded error
app.post('/orders', (req, res) => {
  const outOfStock = checkStock(req.body.items);

  if (outOfStock.length > 0) {
    return res.status(409).json({
      message: 'Some items exceed available stock',
      code: 'STOCK_EXCEEDED',
      // These extra fields end up in ErrorResponse.details:
      items: outOfStock.map(item => ({
        productId: item.id,
        requested: item.requested,
        available: item.available,
      })),
      orderId: req.body.orderId,
    });
  }

  // ... create order
});
```

The client sees this as:

```ts
{ success: false, kind: 'http', status: 409, message: 'Some items exceed available stock', code: 'STOCK_EXCEEDED', details: { items: [...], orderId: '...' } }
```

For validation errors, return a `422` (or any status) with a `validation` map:

```javascript
return res.status(422).json({
  message: 'Validation failed',
  validation: { email: 'Invalid format', age: 'Must be >= 18' },
});
// → { success: false, kind: 'validation', message: 'Validation failed', fields: { email: ..., age: ... } }
```

---

## Hook Error Behavior Summary

| Hook | Return value | `.error` state | Throws? |
|------|--------------|----------------|---------|
| `useCreate` | `Promise<ApiResponse<T>>` | ✅ `ErrorResponse` (in sync with last response) | ❌ No |
| `useUpdate` | `Promise<ApiResponse<T>>` | ✅ `ErrorResponse` | ❌ No |
| `usePatch` | `Promise<ApiResponse<T>>` | ✅ `ErrorResponse` | ❌ No |
| `useDelete` | `Promise<ApiResponse<void>>` | ✅ `ErrorResponse` | ❌ No |
| `useSingleRecord*` mutations | `Promise<ApiResponse<T>>` | ✅ `ErrorResponse` | ❌ No |
| `useList` | `{ data, loading, error, refetch, meta }` | ✅ `ErrorResponse` | ❌ No |
| `useById` / `useRecord` | `{ data, loading, error, refetch }` | ✅ `ErrorResponse` | ❌ No |
