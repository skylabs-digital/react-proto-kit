# Todo App - With Express Backend

This example demonstrates how to use the API Client Service with a real Express.js backend using the FetchConnector.

## Features

- **Express Backend**: RESTful API with in-memory storage
- **Global State**: Automatic synchronization across all components
- **Real-time Updates**: Changes are immediately reflected across the UI
- **URL-based Filtering**: Filter todos using URL parameters
- **Form Validation**: Client-side validation with Zod schemas
- **Error Handling**: Graceful handling of network errors

## Architecture

```
Frontend (React + Vite)     Backend (Express.js)
├── FetchConnector    ←→    ├── REST API (/todos)
├── GlobalStateProvider     ├── In-memory storage
├── useUrlSelector          ├── CORS enabled
└── useFormData             └── Input validation
```

## Getting Started

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run install-backend
```

### 2. Start Both Services

```bash
# Start both backend and frontend concurrently
npm start
```

Or run them separately:

```bash
# Terminal 1: Start backend (port 3001)
npm run backend

# Terminal 2: Start frontend (port 5174)
npm run dev
```

### 3. Open the App

- Frontend: http://localhost:5174
- Backend API: http://localhost:3001/todos
- Health Check: http://localhost:3001/health

## API Endpoints

The Express backend provides these endpoints:

- `GET /todos` - List all todos
- `GET /todos/:id` - Get a specific todo
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo
- `GET /health` - Health check

## Key Differences from Other Examples

### FetchConnector Configuration

```typescript
<ApiClientProvider 
  connectorType="fetch" 
  baseUrl="http://localhost:3001"
>
```

### Global State with Backend

The app uses Global State Provider with the FetchConnector, providing:

- Automatic cache invalidation
- Optimistic updates with server sync
- Real-time synchronization across components
- Network error handling

### Server-side Validation

The backend validates all incoming data and returns appropriate error messages, which are handled gracefully by the frontend.

## Development

- Backend logs all API calls with `[BACKEND]` prefix
- Frontend logs API client operations with `[TODO-BACKEND]` prefix
- Hot reload enabled for both frontend and backend
- CORS configured for local development

## Troubleshooting

If you see connection errors:

1. Make sure the backend is running on port 3001
2. Check that CORS is properly configured
3. Verify the `baseUrl` in ApiClientProvider matches your backend URL
