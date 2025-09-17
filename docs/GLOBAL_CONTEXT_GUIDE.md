# Global Context Guide

React Proto Kit's Global Context system provides automatic state synchronization across your entire application. This guide covers how to use and optimize global state management for maximum performance and developer experience.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Core Concepts](#core-concepts)
- [State Management](#state-management)
- [Caching Strategy](#caching-strategy)
- [Optimistic Updates](#optimistic-updates)
- [Real-time Synchronization](#real-time-synchronization)
- [Performance Optimization](#performance-optimization)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The Global Context system automatically manages application state by:

- **Centralizing Data**: Single source of truth for all entities
- **Automatic Synchronization**: Changes propagate instantly across components
- **Intelligent Caching**: Reduces redundant API calls
- **Optimistic Updates**: Immediate UI feedback with automatic rollback
- **Request Deduplication**: Prevents duplicate network requests

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                  Domain APIs (Hooks)                       │
├─────────────────────────────────────────────────────────────┤
│                   Global State Manager                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Entity    │ │   Loading   │ │    Invalidation     │   │
│  │    Cache    │ │    State    │ │     Manager         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Connectors                            │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### Basic Setup

Wrap your application with the `GlobalStateProvider`:

```tsx
import { BrowserRouter } from 'react-router-dom';
import { ApiClientProvider, GlobalStateProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="fetch" config={{ baseUrl: '/api' }}>
        <GlobalStateProvider>
          <YourApp />
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
```

### Configuration Options

```tsx
interface GlobalStateConfig {
  // Cache configuration
  defaultCacheTime?: number;        // Default: 5 minutes
  maxCacheSize?: number;           // Default: 1000 entities
  
  // Performance settings
  enableOptimistic?: boolean;       // Default: true
  enableDeduplication?: boolean;    // Default: true
  
  // Debug settings
  enableDebugLogging?: boolean;     // Default: false
  logLevel?: 'info' | 'warn' | 'error'; // Default: 'info'
}

function App() {
  return (
    <GlobalStateProvider config={{
      defaultCacheTime: 10 * 60 * 1000, // 10 minutes
      enableOptimistic: true,
      enableDebugLogging: true
    }}>
      <YourApp />
    </GlobalStateProvider>
  );
}
```

## Core Concepts

### Entity State Structure

The global state is organized by entity types:

```tsx
interface GlobalState {
  entities: {
    [entityType: string]: {
      [id: string]: any; // Individual entities
    };
  };
  lists: {
    [cacheKey: string]: string[]; // Array of entity IDs
  };
  loading: {
    [cacheKey: string]: boolean; // Loading states
  };
  errors: {
    [cacheKey: string]: Error | null; // Error states
  };
  lastFetch: {
    [cacheKey: string]: number; // Timestamps
  };
}
```

### Cache Keys

Cache keys are generated deterministically to ensure consistency:

```tsx
// List cache key
const listKey = `users:list:page=1&limit=10&status=active`;

// Single entity cache key
const entityKey = `users:query:id=123`;

// Nested resource cache key
const nestedKey = `posts_comments:list:postId=456&status=published`;
```

### Entity Lifecycle

1. **Fetch**: Data is requested from the connector
2. **Cache**: Response is stored in global state
3. **Distribute**: All subscribed components receive updates
4. **Invalidate**: Related cache entries are marked stale
5. **Cleanup**: Old entries are removed based on TTL

## State Management

### Automatic State Updates

Components automatically receive updates when related data changes:

```tsx
// Component A - Creates a user
function CreateUserForm() {
  const { mutate: createUser } = userApi.useCreate();
  
  const handleSubmit = async (userData) => {
    await createUser(userData);
    // Global state is automatically updated
  };
}

// Component B - Lists users (automatically updates when Component A creates a user)
function UserList() {
  const { data: users } = userApi.useList();
  
  return (
    <div>
      {users?.map(user => <UserItem key={user.id} user={user} />)}
    </div>
  );
}

// Component C - Shows user count (also automatically updates)
function UserStats() {
  const { data: users } = userApi.useList();
  
  return <div>Total Users: {users?.length || 0}</div>;
}
```

### Manual State Management

Access and manipulate global state directly when needed:

```tsx
import { useGlobalState } from '@skylabs-digital/react-proto-kit';

function AdminPanel() {
  const { state, actions } = useGlobalState();
  
  const clearAllCache = () => {
    actions.clearCache();
  };
  
  const invalidateUsers = () => {
    actions.invalidateEntity('users');
  };
  
  const setCustomData = () => {
    actions.setEntity('users', 'custom-id', {
      id: 'custom-id',
      name: 'Custom User',
      email: 'custom@example.com'
    });
  };
  
  return (
    <div>
      <button onClick={clearAllCache}>Clear All Cache</button>
      <button onClick={invalidateUsers}>Invalidate Users</button>
      <button onClick={setCustomData}>Set Custom Data</button>
      
      <div>
        <h3>Cache Status</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </div>
  );
}
```

## Caching Strategy

### Cache Time Configuration

Set different cache times for different data types:

```tsx
// Short cache for frequently changing data
const notificationApi = createDomainApi('notifications', notificationSchema, notificationSchema, {
  cacheTime: 30 * 1000 // 30 seconds
});

// Long cache for stable data
const categoryApi = createDomainApi('categories', categorySchema, categorySchema, {
  cacheTime: 60 * 60 * 1000 // 1 hour
});

// No cache for real-time data
const liveDataApi = createDomainApi('live-data', liveDataSchema, liveDataSchema, {
  cacheTime: 0 // Always fetch fresh
});
```

### Cache Invalidation

Automatic invalidation happens on mutations:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = userApi.useQuery(userId);
  const { mutate: updateUser } = userApi.useUpdate();
  
  const handleUpdate = async (userData) => {
    await updateUser(userId, userData);
    // Automatically invalidates:
    // - users:query:id=123
    // - users:list:* (all user lists)
    // - Related nested resources
  };
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => handleUpdate({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

### Manual Cache Control

```tsx
import { useInvalidation } from '@skylabs-digital/react-proto-kit';

function CacheManager() {
  const { invalidate, invalidateAll, clearCache } = useInvalidation();
  
  const refreshUsers = () => {
    invalidate('users'); // Invalidate all user-related cache
  };
  
  const refreshSpecificList = () => {
    invalidate('users:list:status=active'); // Invalidate specific list
  };
  
  const refreshEverything = () => {
    invalidateAll(); // Invalidate all cache
  };
  
  const clearEverything = () => {
    clearCache(); // Remove all cached data
  };
  
  return (
    <div>
      <button onClick={refreshUsers}>Refresh Users</button>
      <button onClick={refreshSpecificList}>Refresh Active Users</button>
      <button onClick={refreshEverything}>Refresh Everything</button>
      <button onClick={clearEverything}>Clear Cache</button>
    </div>
  );
}
```

## Optimistic Updates

### Automatic Optimistic Updates

Enable optimistic updates for immediate UI feedback:

```tsx
const todoApi = createDomainApi('todos', todoSchema, todoSchema, {
  optimistic: true // Enable optimistic updates
});

function TodoItem({ todo }: { todo: Todo }) {
  const { mutate: updateTodo } = todoApi.useUpdate();
  
  const toggleCompleted = () => {
    // UI updates immediately, then syncs with server
    updateTodo(todo.id, { ...todo, completed: !todo.completed });
  };
  
  return (
    <div className={todo.completed ? 'completed' : ''}>
      <span>{todo.text}</span>
      <button onClick={toggleCompleted}>
        {todo.completed ? 'Undo' : 'Complete'}
      </button>
    </div>
  );
}
```

### Custom Optimistic Logic

```tsx
import { useOptimisticUpdate } from '@skylabs-digital/react-proto-kit';

function CustomOptimisticComponent() {
  const { mutate: updateUser } = userApi.useUpdate();
  const { optimisticUpdate, rollback } = useOptimisticUpdate();
  
  const handleUpdate = async (userId: string, newData: any) => {
    // Apply optimistic update
    const rollbackFn = optimisticUpdate('users', userId, newData);
    
    try {
      await updateUser(userId, newData);
      // Success - optimistic update is kept
    } catch (error) {
      // Error - rollback optimistic update
      rollbackFn();
      throw error;
    }
  };
  
  return (
    <button onClick={() => handleUpdate('123', { name: 'New Name' })}>
      Update User
    </button>
  );
}
```

## Real-time Synchronization

### WebSocket Integration

Integrate with WebSocket for real-time updates:

```tsx
import { useGlobalState } from '@skylabs-digital/react-proto-kit';

function useWebSocketSync() {
  const { actions } = useGlobalState();
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const { type, entityType, data } = JSON.parse(event.data);
      
      switch (type) {
        case 'ENTITY_CREATED':
          actions.setEntity(entityType, data.id, data);
          actions.invalidateEntity(entityType); // Refresh lists
          break;
          
        case 'ENTITY_UPDATED':
          actions.setEntity(entityType, data.id, data);
          break;
          
        case 'ENTITY_DELETED':
          actions.removeEntity(entityType, data.id);
          actions.invalidateEntity(entityType); // Refresh lists
          break;
      }
    };
    
    return () => ws.close();
  }, [actions]);
}

function App() {
  useWebSocketSync();
  
  return <YourApp />;
}
```

### Server-Sent Events

```tsx
function useServerSentEvents() {
  const { actions } = useGlobalState();
  
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      const { type, entityType, data } = JSON.parse(event.data);
      
      // Handle real-time updates
      if (type === 'UPDATE') {
        actions.setEntity(entityType, data.id, data);
      }
    };
    
    return () => eventSource.close();
  }, [actions]);
}
```

## Performance Optimization

### Selective Subscriptions

Subscribe only to specific parts of the state:

```tsx
import { useGlobalStateSelector } from '@skylabs-digital/react-proto-kit';

function UserCount() {
  // Only re-renders when user count changes
  const userCount = useGlobalStateSelector(
    state => Object.keys(state.entities.users || {}).length
  );
  
  return <div>Total Users: {userCount}</div>;
}

function ActiveUserCount() {
  // Only re-renders when active user count changes
  const activeUserCount = useGlobalStateSelector(
    state => Object.values(state.entities.users || {})
      .filter(user => user.status === 'active').length
  );
  
  return <div>Active Users: {activeUserCount}</div>;
}
```

### Memoized Selectors

```tsx
import { createSelector } from '@skylabs-digital/react-proto-kit';

const getUserStats = createSelector(
  (state) => state.entities.users,
  (users) => {
    const userArray = Object.values(users || {});
    return {
      total: userArray.length,
      active: userArray.filter(u => u.status === 'active').length,
      inactive: userArray.filter(u => u.status === 'inactive').length,
    };
  }
);

function UserStats() {
  const stats = useGlobalStateSelector(getUserStats);
  
  return (
    <div>
      <div>Total: {stats.total}</div>
      <div>Active: {stats.active}</div>
      <div>Inactive: {stats.inactive}</div>
    </div>
  );
}
```

### Request Deduplication

Automatic deduplication prevents redundant requests:

```tsx
function MultipleComponents() {
  return (
    <div>
      {/* All these components call userApi.useList() simultaneously */}
      <UserList />      {/* Triggers API call */}
      <UserCount />     {/* Uses cached result */}
      <UserStats />     {/* Uses cached result */}
      <UserDropdown />  {/* Uses cached result */}
    </div>
  );
}
```

## Advanced Patterns

### Cross-Entity Relationships

Manage relationships between different entity types:

```tsx
function useUserWithPosts(userId: string) {
  const { data: user } = userApi.useQuery(userId);
  const { data: posts } = postApi.useList({ userId });
  
  return {
    user,
    posts,
    loading: !user || !posts,
    userWithPosts: user ? { ...user, posts } : null
  };
}

function UserProfile({ userId }: { userId: string }) {
  const { userWithPosts, loading } = useUserWithPosts(userId);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{userWithPosts.user.name}</h1>
      <div>Posts: {userWithPosts.posts.length}</div>
    </div>
  );
}
```

### Computed Properties

Add computed properties to entities:

```tsx
import { useComputedEntities } from '@skylabs-digital/react-proto-kit';

function useEnhancedUsers() {
  return useComputedEntities('users', (user) => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    isActive: user.lastLoginAt > Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
    avatar: user.avatar || '/default-avatar.png'
  }));
}

function UserList() {
  const { data: users } = useEnhancedUsers();
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>
          <img src={user.avatar} alt={user.fullName} />
          <span className={user.isActive ? 'active' : 'inactive'}>
            {user.fullName}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### State Persistence

Persist global state to localStorage:

```tsx
import { useStatePersistence } from '@skylabs-digital/react-proto-kit';

function App() {
  useStatePersistence({
    key: 'app-state',
    entities: ['users', 'settings'], // Only persist specific entities
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  return <YourApp />;
}
```

## Troubleshooting

### Debug Logging

Enable debug logging to troubleshoot issues:

```tsx
import { configureDebugLogging } from '@skylabs-digital/react-proto-kit';

// Enable debug logging
configureDebugLogging(true, '[GLOBAL-STATE]');

// You'll see logs like:
// [GLOBAL-STATE] Cache hit: users:list:page=1
// [GLOBAL-STATE] Cache miss: users:query:id=123
// [GLOBAL-STATE] Optimistic update: users:123
// [GLOBAL-STATE] Rollback: users:123
```

### Common Issues

#### 1. Components Not Updating

**Problem**: Components don't update when data changes

**Solution**: Ensure `GlobalStateProvider` wraps all components:

```tsx
// ❌ Wrong - Provider doesn't wrap all components
function App() {
  return (
    <div>
      <Header /> {/* Won't receive updates */}
      <GlobalStateProvider>
        <Main />
      </GlobalStateProvider>
    </div>
  );
}

// ✅ Correct - Provider wraps entire app
function App() {
  return (
    <GlobalStateProvider>
      <div>
        <Header /> {/* Will receive updates */}
        <Main />
      </div>
    </GlobalStateProvider>
  );
}
```

#### 2. Memory Leaks

**Problem**: Memory usage grows over time

**Solution**: Configure cache limits and cleanup:

```tsx
<GlobalStateProvider config={{
  maxCacheSize: 1000,
  defaultCacheTime: 5 * 60 * 1000,
  enableCleanup: true
}}>
  <App />
</GlobalStateProvider>
```

#### 3. Stale Data

**Problem**: Components show outdated data

**Solution**: Check cache configuration and invalidation:

```tsx
// Reduce cache time for frequently changing data
const liveDataApi = createDomainApi('live-data', schema, schema, {
  cacheTime: 30 * 1000 // 30 seconds
});

// Manual invalidation when needed
const { invalidate } = useInvalidation();
invalidate('live-data');
```

#### 4. Performance Issues

**Problem**: Too many re-renders or slow updates

**Solution**: Use selective subscriptions and memoization:

```tsx
// ❌ Wrong - subscribes to entire state
function UserCount() {
  const { state } = useGlobalState();
  return <div>{Object.keys(state.entities.users || {}).length}</div>;
}

// ✅ Correct - selective subscription
function UserCount() {
  const count = useGlobalStateSelector(
    state => Object.keys(state.entities.users || {}).length
  );
  return <div>{count}</div>;
}
```

The Global Context system provides powerful state management capabilities while maintaining simplicity and performance. Use these patterns to build responsive, real-time applications with minimal boilerplate.
