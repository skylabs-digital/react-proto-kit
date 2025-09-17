/* eslint-disable no-undef */
/* eslint-env node */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Middleware - Allow all CORS for example
app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*'
}));

// HTTP request logger
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage
let todos = [];
let comments = []; // Store comments separately with todoId reference

// Helper function to validate todo data
const validateTodo = (data) => {
  if (!data.text || typeof data.text !== 'string') {
    return { valid: false, error: 'Todo text is required and must be a string' };
  }
  if (data.text.length < 1) {
    return { valid: false, error: 'Todo text is required' };
  }
  if (data.text.length > 10) {
    return { valid: false, error: 'Todo text must be 10 characters or less' };
  }
  if (typeof data.completed !== 'boolean') {
    return { valid: false, error: 'Completed must be a boolean' };
  }
  return { valid: true };
};

// Helper function to validate comment data
const validateComment = (data) => {
  if (!data.text || typeof data.text !== 'string') {
    return { valid: false, error: 'Comment text is required and must be a string' };
  }
  if (data.text.length < 1) {
    return { valid: false, error: 'Comment text is required' };
  }
  if (!data.authorId || typeof data.authorId !== 'string') {
    return { valid: false, error: 'Author ID is required and must be a string' };
  }
  return { valid: true };
};

// Routes

// GET /todos - List all todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// GET /todos/:id - Get a specific todo
app.get('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  res.json(todo);
});

// POST /todos - Create a new todo
app.post('/todos', (req, res) => {
  const validation = validateTodo(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const newTodo = {
    id: uuidv4(),
    text: req.body.text,
    completed: req.body.completed || false,
    views: Math.floor(Math.random() * 100) + 10, // Server-generated field
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const validation = validateTodo(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const updatedTodo = {
    ...todos[todoIndex],
    text: req.body.text,
    completed: req.body.completed,
    updatedAt: new Date().toISOString()
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
});

// PATCH /todos/:id - Partially update a todo
app.patch('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // For PATCH, only validate provided fields
  const updates = {};
  if (req.body.text !== undefined) {
    if (!req.body.text || typeof req.body.text !== 'string' || req.body.text.length < 1 || req.body.text.length > 10) {
      return res.status(400).json({ error: 'Invalid text field' });
    }
    updates.text = req.body.text;
  }
  if (req.body.completed !== undefined) {
    if (typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ error: 'Invalid completed field' });
    }
    updates.completed = req.body.completed;
  }

  const updatedTodo = {
    ...todos[todoIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const deletedTodo = todos.splice(todoIndex, 1)[0];
  res.json(deletedTodo);
});

// ===== NESTED COMMENTS ROUTES =====

// GET /todos/:todoId/comments - List comments for a todo
app.get('/todos/:todoId/comments', (req, res) => {
  const { todoId } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  // Get comments for this todo
  const todoComments = comments.filter(c => c.todoId === todoId);
  
  // Log query params for debugging
  const queryParams = req.query;
  if (Object.keys(queryParams).length > 0) {
    console.log(`[BACKEND] GET /todos/${todoId}/comments with query params:`, queryParams);
  }
  
  res.json(todoComments);
});

// GET /todos/:todoId/comments/:id - Get a specific comment
app.get('/todos/:todoId/comments/:id', (req, res) => {
  const { todoId, id } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const comment = comments.find(c => c.id === id && c.todoId === todoId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  res.json(comment);
});

// POST /todos/:todoId/comments - Create a new comment
app.post('/todos/:todoId/comments', (req, res) => {
  const { todoId } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const validation = validateComment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const newComment = {
    id: uuidv4(),
    todoId: todoId,
    text: req.body.text,
    authorId: req.body.authorId,
    views: Math.floor(Math.random() * 50), // Server-generated field
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  res.status(201).json(newComment);
});

// PUT /todos/:todoId/comments/:id - Update a comment
app.put('/todos/:todoId/comments/:id', (req, res) => {
  const { todoId, id } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const commentIndex = comments.findIndex(c => c.id === id && c.todoId === todoId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const validation = validateComment(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const updatedComment = {
    ...comments[commentIndex],
    text: req.body.text,
    authorId: req.body.authorId,
    updatedAt: new Date().toISOString()
  };

  comments[commentIndex] = updatedComment;
  res.json(updatedComment);
});

// PATCH /todos/:todoId/comments/:id - Partially update a comment
app.patch('/todos/:todoId/comments/:id', (req, res) => {
  const { todoId, id } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const commentIndex = comments.findIndex(c => c.id === id && c.todoId === todoId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // For PATCH, only validate provided fields
  const updates = {};
  if (req.body.text !== undefined) {
    if (!req.body.text || typeof req.body.text !== 'string' || req.body.text.length < 1) {
      return res.status(400).json({ error: 'Invalid text field' });
    }
    updates.text = req.body.text;
  }
  if (req.body.authorId !== undefined) {
    if (!req.body.authorId || typeof req.body.authorId !== 'string') {
      return res.status(400).json({ error: 'Invalid authorId field' });
    }
    updates.authorId = req.body.authorId;
  }

  const updatedComment = {
    ...comments[commentIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  comments[commentIndex] = updatedComment;
  res.json(updatedComment);
});

// DELETE /todos/:todoId/comments/:id - Delete a comment
app.delete('/todos/:todoId/comments/:id', (req, res) => {
  const { todoId, id } = req.params;
  
  // Check if todo exists
  const todo = todos.find(t => t.id === todoId);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const commentIndex = comments.findIndex(c => c.id === id && c.todoId === todoId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const deletedComment = comments.splice(commentIndex, 1)[0];
  res.json(deletedComment);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  // Morgan will handle request logging
  process.stdout.write(`[BACKEND] Todo API server running on http://localhost:${PORT}\n`);
  process.stdout.write(`[BACKEND] Health check: http://localhost:${PORT}/health\n`);
  process.stdout.write(`[BACKEND] Todos endpoint: http://localhost:${PORT}/todos\n`);
});
