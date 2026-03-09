# 🛡️ Error Handling Guide

> Structured error propagation for granular control over API failures.

---

## Overview

React Proto Kit provides a structured `ErrorResponse` object that flows through all connectors and mutation hooks. Instead of generic `Error` strings, you get **typed error codes**, **validation details**, and a **`data` field** that preserves any extra information from the backend response body.

---

## ErrorResponse Interface

```tsx
interface ErrorResponse {
  success: false;
  message?: string;                       // Human-readable error message
  error?: { code: string };               // Machine-readable error code
  type?: 'AUTH' | 'VALIDATION' | 'TRANSACTION' | 'NAVIGATION';
  validation?: Record<string, string>;    // Field-level validation errors
  data?: Record<string, unknown>;         // Any extra fields from the response body
}
```

### How `data` is populated

When the backend returns an error response (`!response.ok`), the `FetchConnector` extracts the **known fields** (`message`, `code`, `type`, `validation`) and puts everything else into `data`:

```
Backend response body:
{
  "message": "Stock exceeded",
  "code": "STOCK_EXCEEDED",
  "type": "TRANSACTION",
  "items": [{ "productId": "p1", "requested": 5, "available": 2 }],
  "orderId": "order-123"
}

Resulting ErrorResponse:
{
  success: false,
  message: "Stock exceeded",
  error: { code: "STOCK_EXCEEDED" },
  type: "TRANSACTION",
  data: {
    items: [{ productId: "p1", requested: 5, available: 2 }],
    orderId: "order-123"
  }
}
```

> 💡 If the error body only contains known fields (`message`, `code`, `type`, `validation`), then `data` is `undefined`.

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

### 🔹 Catching Errors with try/catch

`useCreate` throws the full `ErrorResponse` on failure (not a plain `Error`):

```tsx
const { mutate: createOrder } = orderApi.useCreate();

const handleCheckout = async (checkoutData: CheckoutInput) => {
  try {
    const order = await createOrder(checkoutData);
    navigate(`/orders/${order.id}`);
  } catch (err) {
    const error = err as ErrorResponse;

    switch (error.error?.code) {
      case 'STOCK_EXCEEDED':
        const items = error.data?.items as StockExceededItem[];
        showStockDialog(items);
        break;

      case 'PAYMENT_DECLINED':
        showPaymentError(error.message);
        break;

      case 'VALIDATION_ERROR':
        // Field-level errors are in error.validation
        Object.entries(error.validation || {}).forEach(([field, msg]) => {
          setFieldError(field, msg);
        });
        break;

      default:
        showGenericError(error.message || 'Something went wrong');
    }
  }
};
```

### 🔹 Validation Errors

When Zod schema validation fails on the client, `useCreate` returns a `VALIDATION` type error with field-level details:

```tsx
const { mutate, error } = todoApi.useCreate();

// If input fails schema validation:
// error = {
//   success: false,
//   message: "Validation failed",
//   error: { code: "VALIDATION_ERROR" },
//   type: "VALIDATION",
//   validation: {
//     "text": "String must contain at least 1 character(s)",
//     "priority": "Invalid enum value"
//   }
// }

{error?.type === 'VALIDATION' && error.validation && (
  <ul className="validation-errors">
    {Object.entries(error.validation).map(([field, msg]) => (
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

if (error?.type === 'AUTH') {
  // Redirect to login
  navigate('/login');
}
```

### 🔹 Using with Snackbar

```tsx
import { useSnackbar, ErrorResponse } from '@skylabs-digital/react-proto-kit';

function OrderButton({ data }: { data: OrderInput }) {
  const { mutate } = orderApi.useCreate();
  const { showSnackbar } = useSnackbar();

  const handleClick = async () => {
    try {
      await mutate(data);
      showSnackbar({ message: '✅ Order placed!', variant: 'success' });
    } catch (err) {
      const error = err as ErrorResponse;
      showSnackbar({
        message: error.message || 'Order failed',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  return <button onClick={handleClick}>Place Order</button>;
}
```

---

## Error Types

| Type | Description | Common Codes |
|------|-------------|--------------|
| `AUTH` | Authentication/authorization failure | `UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_EXPIRED` |
| `VALIDATION` | Input validation failure | `VALIDATION_ERROR`, `INVALID_INPUT` |
| `TRANSACTION` | Business logic failure | `STOCK_EXCEEDED`, `PAYMENT_DECLINED`, `DUPLICATE_ENTRY` |
| `NAVIGATION` | Routing/resource not found | `NOT_FOUND`, `GONE` |

---

## Backend Contract

For the `data` field to work, your backend should return error responses as JSON with at least a `message` and/or `code` field. Any additional fields will be preserved in `data`:

```javascript
// Express.js example — stock exceeded error
app.post('/orders', (req, res) => {
  const outOfStock = checkStock(req.body.items);

  if (outOfStock.length > 0) {
    return res.status(409).json({
      message: 'Some items exceed available stock',
      code: 'STOCK_EXCEEDED',
      type: 'TRANSACTION',
      // These extra fields end up in ErrorResponse.data:
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

---

## Backward Compatibility

- **`data` is optional** — existing consumers that don't use it are unaffected.
- **`ErrorResponse.message` still works** — patterns like `error.message || 'fallback'` continue to function.
- **`useCreate` throws `ErrorResponse` (not `Error`)** — existing `catch` blocks using `err instanceof Error ? err.message : '...'` will fall to the else branch. Since `ErrorResponse` has a `.message` property, `String(err.message)` still works.

---

## Hook Error Behavior Summary

| Hook | On failure | `.error` property | Throws? |
|------|-----------|-------------------|---------|
| `useCreate` | Sets `.error` + throws `ErrorResponse` | ✅ `ErrorResponse` | ✅ Yes |
| `useUpdate` | Sets `.error` | ✅ `ErrorResponse` | ❌ No |
| `usePatch` | Sets `.error` | ✅ `ErrorResponse` | ❌ No |
| `useDelete` | Sets `.error` | ✅ `ErrorResponse` | ❌ No |
| `useList` | Sets `.error` | ✅ `ErrorResponse` | ❌ No |
| `useQuery` / `useById` | Sets `.error` | ✅ `ErrorResponse` | ❌ No |
