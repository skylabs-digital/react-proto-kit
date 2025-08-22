# Blog Platform - With Backend

A full-featured blog platform example demonstrating React Proto Kit with Express.js backend integration.

## Features

- **Express Backend Integration**: Full CRUD operations with Express.js server
- **Global State Management**: Automatic synchronization across all components
- **Optimistic Updates**: Immediate UI updates with automatic rollback on errors
- **Intelligent Cache Invalidation**: Related entities invalidate each other automatically
- **Real-time Synchronization**: All components stay in sync automatically
- **Form Validation**: Comprehensive form handling with Zod schemas
- **URL State Management**: Filter states persist in URL parameters

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js with in-memory storage
- **State Management**: Global Context with intelligent invalidation
- **Data Fetching**: FetchConnector for HTTP communication
- **Validation**: Zod schemas for type-safe data handling

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### Running the Application

#### Option 1: Run both frontend and backend together
```bash
npm run dev:full
```

#### Option 2: Run separately

1. Start the backend server:
```bash
npm run backend
```

2. In another terminal, start the frontend:
```bash
npm run dev
```

The backend will run on http://localhost:3002
The frontend will run on http://localhost:5174

## API Endpoints

### Posts
- `GET /posts` - List all posts
- `GET /posts/:id` - Get post by ID
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

### Categories
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Users
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID

### Comments
- `GET /comments` - List all comments
- `GET /comments/:id` - Get comment by ID
- `POST /comments` - Create new comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

## Key Differences from Other Examples

### vs. blog-without-global-context
- ✅ Automatic synchronization between components
- ✅ No manual refresh callbacks needed
- ✅ Optimistic updates with rollback
- ✅ Backend persistence

### vs. blog-with-global-context
- ✅ Real backend with HTTP API
- ✅ Data persistence across sessions
- ✅ Network error handling
- ✅ Server-side validation

### vs. todo-with-backend
- 📝 Blog-specific entities (posts, categories, comments)
- 📝 More complex data relationships
- 📝 Rich text content handling
- 📝 Publishing workflow (draft/published)

## Global State Configuration

```typescript
export const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['comments'], // When posts change, invalidate comments
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

export const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts'], // When comments change, invalidate posts
  cacheTime: 3 * 60 * 1000, // 3 minutes
});
```

## Component Architecture

```
src/
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── BackendInfo.tsx     # Backend connection info
│   ├── Sidebar.tsx         # Blog stats, categories, activity
│   ├── PostList.tsx        # Posts listing with filters
│   ├── PostForm.tsx        # Create/edit post form
│   └── PostDetail.tsx      # Post detail with comments
├── api.ts                  # API configuration
├── types.ts                # TypeScript types and schemas
├── App.tsx                 # Main app component
└── main.tsx               # App entry point
```

## Development Notes

- Backend uses in-memory storage (data resets on server restart)
- Automatic slug generation from post titles
- Form validation with real-time error display
- Responsive design for mobile devices
- Debug logging enabled for backend communication

## Troubleshooting

### Backend Connection Issues
- Ensure the Express server is running on port 3002
- Check browser console for CORS errors
- Verify the `baseUrl` in ApiClientProvider configuration

### Data Not Persisting
- Backend uses in-memory storage - data resets when server restarts
- For production, replace with a real database

### Port Conflicts
- Backend runs on port 3002
- Frontend runs on port 5174
- Modify ports in package.json and vite.config.ts if needed
