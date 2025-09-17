import { z } from 'zod';
import { createDomainApi } from '../src';

// Schema para comentarios
const commentSchema = z.object({
  text: z.string(),
  authorId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const commentUpsertSchema = z.object({
  text: z.string(),
  authorId: z.string(),
});

// Schema para todos
const todoSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const todoUpsertSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
});

// Ejemplo 1: API simple (sin parámetros)
const todosApi = createDomainApi('todos', todoSchema, todoUpsertSchema);

// Ejemplo 2: API con rutas anidadas (con parámetros)
const commentsApi = createDomainApi('todos/:todoId/comments', commentSchema, commentUpsertSchema);

// Uso del API simple
console.log('=== API Simple ===');
// Esto debería funcionar directamente
const todosList = todosApi.useList();
const createTodo = todosApi.useCreate();

// Uso del API con rutas anidadas
console.log('=== API con Rutas Anidadas ===');
// Esto requiere usar withParams para inyectar los parámetros
const todoCommentsApi = commentsApi.withParams({ todoId: 'todo-123' });
const commentsList = todoCommentsApi.useList();
const createComment = todoCommentsApi.useCreate();

console.log('Test completed successfully!');
