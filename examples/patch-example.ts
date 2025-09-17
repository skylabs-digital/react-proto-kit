import { z } from 'zod';
import { createDomainApi } from '../src/factory/createDomainApi';

// Define schemas
const todoSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
});

const upsertSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
});

// Example 1: Basic usage with businessSchema
const todosApi = createDomainApi('todos', todoSchema);

// Example 2: With upsertSchema
const todosApiWithUpsert = createDomainApi('todos', todoSchema, {
  upsertSchema: upsertSchema,
  globalState: false,
});

// Usage examples:

// 1. Basic PATCH - updates the entire resource
function usePatchTodo() {
  const patchMutation = todosApi.usePatch();

  const patchTodo = async (id: string, updates: Partial<z.infer<typeof todoSchema>>) => {
    try {
      const result = await patchMutation.mutate(id, updates);
      console.log('Todo patched successfully:', result);
    } catch (error) {
      console.error('Error patching todo:', error);
    }
  };

  return { patchTodo, loading: patchMutation.loading, error: patchMutation.error };
}

// 2. Field-specific PATCH - updates only a specific field
function usePatchTodoField() {
  const patchMutation = todosApi.usePatch();

  const patchCompleted = async (id: string, completed: boolean) => {
    try {
      // This will send PATCH to /todos/{id}/completed
      const result = await patchMutation.mutate(id, { completed }, 'completed');
      console.log('Todo completed status updated:', result);
    } catch (error) {
      console.error('Error updating completed status:', error);
    }
  };

  return { patchCompleted, loading: patchMutation.loading, error: patchMutation.error };
}

// 3. Using with upsertSchema
function usePatchTodoWithUpsert() {
  const patchMutation = todosApiWithUpsert.usePatch();

  const patchTodo = async (id: string, updates: Partial<z.infer<typeof upsertSchema>>) => {
    try {
      // Will use upsertSchema for validation instead of todoSchema
      const result = await patchMutation.mutate(id, updates);
      console.log('Todo patched with upsert schema:', result);
    } catch (error) {
      console.error('Error patching todo with upsert schema:', error);
    }
  };

  return { patchTodo, loading: patchMutation.loading, error: patchMutation.error };
}

// Example HTTP requests that would be generated:

// 1. Basic PATCH: PATCH /todos/123 (partial update)
// mutate(id, updates) -> PATCH /todos/123 with body: updates

// 2. Field-specific PATCH: PATCH /todos/123/completed
// mutate(id, { completed: true }, 'completed') -> PATCH /todos/123/completed
// Body: { completed: true }

// 3. With upsertSchema: PATCH /todos/123
// Uses upsertSchema for validation instead of todoSchema

// 4. Other operations:
// useUpdate().mutate(id, data) -> PUT /todos/123 (full update)
// useDelete().mutate(id) -> DELETE /todos/123
// useCreate().mutate(tempId, data) -> POST /todos (tempId can be any string for optimistic updates)

export { usePatchTodo, usePatchTodoField, usePatchTodoWithUpsert, todosApi, todosApiWithUpsert };
