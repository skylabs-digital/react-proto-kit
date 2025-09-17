# PATCH Feature Implementation

This document describes the new PATCH functionality and upsertSchema support added to the React Proto Kit.

## Overview

The React Proto Kit now supports:
1. **usePatch hook** - For partial resource updates using HTTP PATCH
2. **upsertSchema** - Optional schema for create/update operations
3. **Field-specific PATCH** - Target specific fields with PATCH requests

## Features

### 1. upsertSchema Support

You can now provide a separate schema for create and update operations:

```typescript
const todoSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
  // ... other response fields
});

const upsertSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
  // Simplified schema for create/update operations
});

const todosApi = createDomainApi('todos', todoSchema, {
  upsertSchema: upsertSchema,
  globalState: false,
});
```

**Benefits:**
- Different validation rules for input vs output
- Cleaner API contracts
- Better type safety for mutations

### 2. usePatch Hook

The new `usePatch` hook enables partial resource updates:

```typescript
const todosApi = createDomainApi('todos', todoSchema);

// Basic usage
function MyComponent() {
  const patchMutation = todosApi.usePatch();
  
  const handlePatch = async (id: string) => {
    try {
      await patchMutation.mutate(
        { completed: true }, // Partial update
        id
      );
    } catch (error) {
      console.error('Patch failed:', error);
    }
  };

  return (
    <button 
      onClick={() => handlePatch('todo-123')}
      disabled={patchMutation.loading}
    >
      {patchMutation.loading ? 'Updating...' : 'Mark Complete'}
    </button>
  );
}
```

### 3. Field-Specific PATCH

Target specific fields by providing the field name:

```typescript
function useToggleComplete() {
  const patchMutation = todosApi.usePatch(undefined, 'completed');
  
  const toggleComplete = async (id: string, completed: boolean) => {
    // This sends: PATCH /todos/{id}/completed
    await patchMutation.mutate({ completed }, id);
  };

  return { toggleComplete, loading: patchMutation.loading };
}
```

## HTTP Behavior

The implementation generates different HTTP requests based on the hook used:

| Hook | HTTP Method | Endpoint | Purpose |
|------|-------------|----------|---------|
| `useCreate()` | POST | `/todos` | Create new resource |
| `useUpdate()` | PUT | `/todos/123` | Full resource update |
| `usePatch()` | PATCH | `/todos/123` | Partial resource update |
| `usePatch(id, field)` | PATCH | `/todos/123/field` | Field-specific update |

## Type Safety

The implementation maintains full type safety:

```typescript
type TodoEntity = z.infer<typeof todoSchema>;
type TodoInput = Omit<TodoEntity, 'id' | 'createdAt' | 'updatedAt'>;
type TodoPatch = Partial<TodoInput>;

// usePatch accepts TodoPatch type
const patchMutation = todosApi.usePatch();
await patchMutation.mutate({
  completed: true,        // ✅ Valid
  title: "New title",     // ✅ Valid
  invalidField: "test"    // ❌ TypeScript error
});
```

## Connector Support

Both connectors support PATCH operations:

### FetchConnector
- Sends HTTP PATCH requests with JSON body
- Supports field-specific endpoints
- Handles validation and error responses

### LocalStorageConnector
- Performs partial updates in localStorage
- Maintains data consistency
- Simulates network delays and errors

## Migration Guide

The new features are backward compatible. Existing code continues to work without changes.

### To add upsertSchema:

```typescript
// Before
const api = createDomainApi('todos', todoSchema);

// After
const api = createDomainApi('todos', todoSchema, {
  upsertSchema: createUpdateSchema, // Optional
});
```

### To use PATCH instead of PUT:

```typescript
// Before (full update)
const updateMutation = api.useUpdate();
await updateMutation.mutate(fullTodoObject, id);

// After (partial update)
const patchMutation = api.usePatch();
await patchMutation.mutate({ completed: true }, id);
```

## Examples

See `examples/patch-example.ts` for complete usage examples.

## Implementation Details

### Core Changes
1. Added `upsertSchema?: z.ZodSchema` to `GlobalStateConfig`
2. Added `usePatch` method to `GeneratedCrudApi` interface
3. Added `patch` method to `IConnector` interface
4. Updated both connectors to support PATCH operations
5. Enhanced `createDomainApi` to use `upsertSchema` when available

### Files Modified
- `src/types/index.ts` - Type definitions
- `src/factory/createDomainApi.ts` - Core API factory
- `src/connectors/FetchConnector.ts` - HTTP PATCH support
- `src/connectors/LocalStorageConnector.ts` - localStorage PATCH support
- `src/hooks/usePatchMutation.ts` - New PATCH hook
- `examples/patch-example.ts` - Usage examples

The implementation maintains the existing patterns and conventions of the React Proto Kit while adding powerful new capabilities for partial updates.
