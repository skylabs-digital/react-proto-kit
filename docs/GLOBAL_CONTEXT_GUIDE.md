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

Most of the time you don't need manual cache control: mutations from the generated api methods (`useCreate`, `useUpdate`, `usePatch`, `useDelete`) invalidate their entity automatically. Use `useInvalidation` when you need to refresh data after an action the library doesn't know about — a websocket event, a custom mutation endpoint, a user-triggered refresh button, etc.

```tsx
import { useInvalidation } from '@skylabs-digital/react-proto-kit';

function CacheManager() {
  const { invalidate, invalidateAll } = useInvalidation();

  const refreshUsers = () => {
    // Refetch every subscribed useList / useById / useRecord for `users`.
    invalidate('users');
  };

  const refreshEverything = () => {
    // Refetch every subscribed entity in the app. Use sparingly.
    invalidateAll();
  };

  return (
    <div>
      <button onClick={refreshUsers}>Refresh Users</button>
      <button onClick={refreshEverything}>Refresh Everything</button>
    </div>
  );
}
```

Invalidation calls are coalesced: if five components listen for the same entity, they share a single network request via the built-in request deduplication layer.

## Optimistic Updates

> **Status:** Not implemented. The `optimistic` flag on `GlobalStateConfig` is a no-op kept for type compatibility. Mutations instead use a **direct cache write plus background refetch** strategy: the cache is updated immediately after a successful response for a snappy UI, and an invalidation is emitted so subscribed queries reconcile against the backend. This keeps the backend as the source of truth without an optimistic rollback story.
>
> If you need true optimistic UI (apply the change before the request resolves, roll back on failure), you can build it in userland by reading from and writing to the global state directly, or open an issue requesting the feature as a follow-up.

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

> **Status:** `useGlobalStateSelector` and `createSelector` are not implemented. Until they land, derive computed values from the hook results directly with `useMemo`, or compose smaller hooks that consume `useList` / `useRecord` and transform the output. If selective subscription becomes a bottleneck, open an issue so we can prioritize it.

```tsx
// Build your own in userland: useList already gives you the array,
// useMemo narrows re-renders to the derivation you care about.
function UserCount() {
  const { data: users } = userApi.useList();
  const count = useMemo(() => users?.length ?? 0, [users]);
  return <div>Total Users: {count}</div>;
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

> **Status:** `useComputedEntities` is not implemented. Compose the derivation in a regular hook instead:

```tsx
function useEnhancedUsers() {
  const { data: users } = userApi.useList();
  return useMemo(
    () =>
      users?.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        isActive: user.lastLoginAt > Date.now() - 30 * 24 * 60 * 60 * 1000,
        avatar: user.avatar || '/default-avatar.png',
      })),
    [users]
  );
}
```

### State Persistence

> **Status:** `useStatePersistence` is not implemented. For offline prototyping, use the `LocalStorageConnector`, which persists request/response data transparently. For selective persistence of specific cache slices, open an issue describing your use case.

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
// [GLOBAL-STATE] Invalidating: users (triggered by useUpdate)
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

**Solution**: Narrow what each component reads and memoize derivations:

```tsx
// ❌ Wrong - reads the full list on every parent re-render
function UserCount({ users }: { users: User[] }) {
  return <div>{users.length}</div>;
}

// ✅ Better - let the hook and useMemo handle the narrowing
function UserCount() {
  const { data: users } = userApi.useList();
  const count = useMemo(() => users?.length ?? 0, [users]);
  return <div>{count}</div>;
}
```

The Global Context system provides powerful state management capabilities while maintaining simplicity and performance. Use these patterns to build responsive, real-time applications with minimal boilerplate.
