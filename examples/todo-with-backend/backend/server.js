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
