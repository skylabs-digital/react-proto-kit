# Migration Guide

This guide helps you migrate between different versions of React Proto Kit and provides strategies for adopting the library in existing projects.

## Table of Contents

- [Version Migration](#version-migration)
- [Adopting in Existing Projects](#adopting-in-existing-projects)
- [Breaking Changes](#breaking-changes)
- [Migration Strategies](#migration-strategies)
- [Common Issues](#common-issues)

## Version Migration

### From v1.x to v2.x (Current)

The current version represents a major refactor with significant improvements to the API design and type system.

#### Key Changes

1. **Simplified createDomainApi signature**
2. **Builder pattern for dynamic configuration**
3. **Separate entity and upsert schemas**
4. **Improved type inference**
5. **Enhanced nested resource support**

#### Migration Steps

##### 1. Update createDomainApi calls

**Before (v1.x):**
```tsx
const userApi = createDomainApi('users', {
  entitySchema: userSchema,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  path: { template: '/users' },
  queryParams: {
    static: { include: 'profile' },
    dynamic: ['status', 'role']
  }
});
```

**After (v2.x):**
```tsx
const userApi = createDomainApi('users', userSchema, userCreateSchema, {
  queryParams: {
    static: { include: 'profile' },
    dynamic: ['status', 'role']
  }
});
```

##### 2. Update hook usage with path parameters

**Before (v1.x):**
```tsx
const { data: posts } = postApi.useList({
  pathParams: { userId: '123' },
  queryParams: { status: 'published' }
});
```

**After (v2.x):**
```tsx
const { data: posts } = postApi
  .withParams({ userId: '123' })
  .withQuery({ status: 'published' })
  .useList();
```

##### 3. Update type extraction

**Before (v1.x):**
```tsx
type User = InferType<typeof userApi>;
```

**After (v2.x):**
```tsx
type User = ExtractEntityType<typeof userApi>;
type UserInput = ExtractInputType<typeof userApi>;
```

##### 4. Update schema definitions

**Before (v1.x):**
```tsx
const userEntitySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  name: z.string(),
  email: z.string(),
});

const userCreateSchema = z.object({
  name: z.string(),
  email: z.string(),
});
```

**After (v2.x):**
```tsx
// Entity schema (includes server-generated fields)
const userEntitySchema = z.object({
  name: z.string(),
  email: z.string(),
  avatar: z.string().url(), // Server-generated
});

// Upsert schema (only client-sendable fields)
const userUpsertSchema = z.object({
  name: z.string(),
  email: z.string(),
});

// Auto-generated fields (id, createdAt, updatedAt) are added automatically
```

#### Automated Migration Script

Use this script to help with the migration:

```bash
#!/bin/bash

# Update import statements
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/InferType/ExtractEntityType/g'

# Update createDomainApi calls (manual review required)
echo "Please manually review createDomainApi calls for new signature"
```

### From Legacy APIs to React Proto Kit

If you're migrating from a custom API solution or other libraries:

#### Step 1: Identify Current Patterns

Document your current API patterns:

```tsx
// Current pattern
const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);
  
  return { users, loading };
};
```

#### Step 2: Create Equivalent Schema

```tsx
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

const userApi = createDomainApi('users', userSchema, userSchema);
```

#### Step 3: Replace Hook Usage

```tsx
// New pattern
const UserList = () => {
  const { data: users, loading } = userApi.useList();
  
  return (
    <div>
      {loading ? 'Loading...' : users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

## Adopting in Existing Projects

### Gradual Migration Strategy

#### Phase 1: Setup and Simple Entities

1. Install React Proto Kit
2. Set up providers
3. Migrate simple, standalone entities first

```tsx
// Start with simple entities
const userApi = createDomainApi('users', userSchema, userSchema);

// Keep existing APIs for complex entities
const legacyPostApi = useExistingPostApi();
```

#### Phase 2: Complex Entities

1. Migrate entities with relationships
2. Update related components
3. Test thoroughly

```tsx
// Migrate related entities
const postApi = createDomainApi('posts', postSchema, postSchema);
const commentApi = createDomainApi('posts/:postId/comments', commentSchema, commentSchema);
```

#### Phase 3: Global State Migration

1. Enable global state
2. Remove redundant state management
3. Optimize performance

```tsx
// Enable global state for real-time sync
const userApi = createDomainApi('users', userSchema, userSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000
});
```

### Coexistence Patterns

#### Wrapper Pattern

Wrap existing APIs to match React Proto Kit interface:

```tsx
function createLegacyWrapper(legacyApi: any) {
  return {
    useList: () => {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      
      useEffect(() => {
        legacyApi.getAll()
          .then(setData)
          .catch(setError)
          .finally(() => setLoading(false));
      }, []);
      
      return { data, loading, error, refetch: () => {} };
    },
    
    useCreate: () => ({
      mutate: legacyApi.create,
      loading: false,
      error: null
    })
  };
}
```

#### Feature Flag Pattern

Use feature flags to control migration:

```tsx
const useFeatureFlag = (flag: string) => {
  return process.env[`REACT_APP_${flag}`] === 'true';
};

function UserList() {
  const useNewApi = useFeatureFlag('NEW_USER_API');
  
  const api = useNewApi ? userApi : legacyUserWrapper;
  const { data: users, loading } = api.useList();
  
  return (
    <div>
      {loading ? 'Loading...' : users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## Breaking Changes

### v2.0.0 Breaking Changes

#### 1. createDomainApi Signature Change

**Breaking:** Function signature simplified

**Migration:** Update all createDomainApi calls to use new signature

#### 2. Path Parameters

**Breaking:** Path parameters now use builder pattern instead of options

**Migration:** Replace pathParams option with .withParams() call

#### 3. Type Utilities

**Breaking:** InferType replaced with ExtractEntityType/ExtractInputType

**Migration:** Update all type extraction calls

#### 4. Schema Structure

**Breaking:** Auto-generated fields no longer included in schemas

**Migration:** Remove id, createdAt, updatedAt from schemas

### v1.11.0 Breaking Changes

#### 1. Global State Integration

**Breaking:** Global state behavior changed for loading states

**Migration:** Update components expecting different loading behavior

#### 2. LocalStorage Connector

**Breaking:** Nested resource storage structure changed

**Migration:** Clear localStorage or migrate data structure

## Migration Strategies

### Big Bang Migration

Migrate entire application at once:

**Pros:**
- Clean, consistent codebase
- No maintenance of dual systems
- Immediate benefits

**Cons:**
- High risk
- Requires extensive testing
- Potential for extended downtime

**Best for:** Small applications, greenfield projects

### Strangler Fig Migration

Gradually replace old system:

**Pros:**
- Low risk
- Continuous delivery
- Easy rollback

**Cons:**
- Longer migration period
- Temporary complexity
- Dual maintenance

**Best for:** Large applications, production systems

### Parallel Run Migration

Run both systems simultaneously:

**Pros:**
- Safe comparison
- Easy rollback
- Gradual user migration

**Cons:**
- Resource intensive
- Complex data synchronization
- Extended maintenance

**Best for:** Critical systems, data validation needed

## Common Issues

### Type Inference Problems

**Issue:** TypeScript not inferring correct types

**Solution:**
```tsx
// Ensure proper schema definition
const userSchema = z.object({
  name: z.string(),
  email: z.string(),
});

// Use explicit type extraction
type User = ExtractEntityType<typeof userApi>;
```

### Global State Conflicts

**Issue:** State not synchronizing across components

**Solution:**
```tsx
// Ensure GlobalStateProvider wraps all components
<GlobalStateProvider>
  <App />
</GlobalStateProvider>

// Check for multiple provider instances
```

### Performance Issues

**Issue:** Too many re-renders or API calls

**Solution:**
```tsx
// Use proper memoization
const MemoizedComponent = memo(UserList);

// Configure appropriate cache times
const userApi = createDomainApi('users', userSchema, userSchema, {
  cacheTime: 5 * 60 * 1000 // 5 minutes
});
```

### Schema Validation Errors

**Issue:** Runtime validation failures

**Solution:**
```tsx
// Ensure schemas match API responses
const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  // Don't include server-generated fields
});

// Use proper error handling
const { data, error } = userApi.useList();
if (error) {
  console.error('Validation error:', error);
}
```

### Nested Resource Issues

**Issue:** Nested resources not working correctly

**Solution:**
```tsx
// Use proper path templates
const commentApi = createDomainApi('posts/:postId/comments', commentSchema, commentSchema);

// Ensure path parameters are provided
const api = commentApi.withParams({ postId: '123' });
const { data: comments } = api.useList();
```

## Migration Checklist

### Pre-Migration

- [ ] Audit current API usage patterns
- [ ] Identify dependencies and relationships
- [ ] Plan migration phases
- [ ] Set up testing environment
- [ ] Create rollback plan

### During Migration

- [ ] Update dependencies
- [ ] Install React Proto Kit
- [ ] Set up providers
- [ ] Migrate schemas
- [ ] Update API calls
- [ ] Update type definitions
- [ ] Test thoroughly
- [ ] Update documentation

### Post-Migration

- [ ] Remove old dependencies
- [ ] Clean up unused code
- [ ] Optimize performance
- [ ] Monitor for issues
- [ ] Update team documentation
- [ ] Celebrate! 🎉

## Getting Help

If you encounter issues during migration:

1. **Check Documentation**: Review the latest API documentation
2. **Search Issues**: Look for similar issues on GitHub
3. **Create Issue**: Report bugs or request help
4. **Community**: Join discussions for community support

Remember: Migration is a process, not an event. Take your time, test thoroughly, and don't hesitate to ask for help!
