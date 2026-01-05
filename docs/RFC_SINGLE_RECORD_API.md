# RFC: Single Record API Factory

## Status: Implemented ✅
## Date: 2026-01-05
## Author: Development Team

---

## Summary

Introduce two new factory functions for handling single-record endpoints that don't follow the traditional CRUD list pattern. These are typically configuration endpoints or computed/aggregate endpoints.

---

## Motivation

Currently, `createDomainApi` is designed for list-based CRUD operations where:
- `GET /resource` returns a list
- `GET /resource/:id` returns a single item
- `POST /resource` creates a new item
- `PUT /resource/:id` updates an item
- `DELETE /resource/:id` deletes an item

However, many APIs have **single-record endpoints** that don't fit this pattern:

```
GET  /users/:userId/settings     → Returns single settings object
PUT  /users/:userId/settings     → Updates settings (no ID needed)
PATCH /users/:userId/settings    → Partial update

GET  /dashboard/stats            → Returns computed statistics (read-only)
GET  /users/:userId/profile      → Returns user profile
```

These endpoints:
- **Don't have pagination** - always return a single object
- **Don't use ID for mutations** - the resource is identified by the path itself
- **May be read-only** - computed/aggregate data that can't be modified

---

## Proposed Solution

### Two New Factory Functions

#### 1. `createSingleRecordApi` - Full CRUD for single record

```typescript
import { createSingleRecordApi } from 'react-proto-kit';

const settingsApi = createSingleRecordApi(
  'users/:userId/settings',
  settingsSchema,      // Entity schema for response
  settingsInputSchema, // Upsert schema for mutations
  {
    queryParams: {
      static: { include: 'preferences' },
      dynamic: ['section']
    }
  }
);
```

**Available methods:**
- `withParams(params)` - Inject path parameters
- `withQuery(queryParams)` - Inject query parameters
- `useFetch()` - GET single record (no pagination)
- `useUpdate()` - PUT without ID
- `usePatch()` - PATCH without ID

**NOT available:**
- ~~`useList`~~ - No list for single record
- ~~`useById`~~ - Resource identified by path, not ID
- ~~`useCreate`~~ - Resource already exists, only update
- ~~`useDelete`~~ - Typically not deletable (use case specific)

#### 2. `createReadOnlyApi` - Read-only single record

```typescript
import { createReadOnlyApi } from 'react-proto-kit';

const statsApi = createReadOnlyApi(
  'dashboard/stats',
  statsSchema,
  {
    cacheTime: 60000, // 1 minute cache
    queryParams: {
      static: { format: 'detailed' },
      dynamic: ['dateRange', 'groupBy']
    }
  }
);
```

**Available methods:**
- `withParams(params)` - Inject path parameters
- `withQuery(queryParams)` - Inject query parameters
- `useFetch()` - GET single record (read-only)

**NOT available:**
- ~~`useList`~~ - No list
- ~~`useById`~~ - Resource identified by path
- ~~`useCreate`~~ - Read-only
- ~~`useUpdate`~~ - Read-only
- ~~`usePatch`~~ - Read-only
- ~~`useDelete`~~ - Read-only

---

## API Design

### Function Signatures

```typescript
// Full CRUD single record
function createSingleRecordApi<
  TEntity extends z.ZodSchema,
  TUpsert extends z.ZodSchema
>(
  pathTemplate: string,
  entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: SingleRecordConfig
): SingleRecordApi<TEntity, TUpsert>;

// Read-only single record
function createReadOnlyApi<TEntity extends z.ZodSchema>(
  pathTemplate: string,
  entitySchema: TEntity,
  config?: ReadOnlyConfig
): ReadOnlyApi<TEntity>;
```

### Config Types

```typescript
interface SingleRecordConfig {
  cacheTime?: number;
  queryParams?: QueryParamsConfig;
  // No globalState - single records typically don't need list invalidation
}

interface ReadOnlyConfig {
  cacheTime?: number;
  queryParams?: QueryParamsConfig;
  refetchInterval?: number; // Auto-refetch for real-time data
}

interface QueryParamsConfig {
  static?: Record<string, any>;
  dynamic?: string[];
}
```

### Return Types

```typescript
interface SingleRecordApi<TEntity, TUpsert> {
  withParams: (params: Record<string, string>) => SingleRecordApi<TEntity, TUpsert>;
  withQuery: (queryParams: Record<string, any>) => SingleRecordApi<TEntity, TUpsert>;
  useFetch: () => UseFetchResult<z.infer<TEntity>>;
  useUpdate: () => UseUpdateMutationResult<z.infer<TUpsert>>;
  usePatch: () => UsePatchMutationResult<Partial<z.infer<TUpsert>>>;
}

interface ReadOnlyApi<TEntity> {
  withParams: (params: Record<string, string>) => ReadOnlyApi<TEntity>;
  withQuery: (queryParams: Record<string, any>) => ReadOnlyApi<TEntity>;
  useFetch: () => UseFetchResult<z.infer<TEntity>>;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

---

## Usage Examples

### Example 1: User Settings (Full CRUD)

```typescript
// Definition
const userSettingsApi = createSingleRecordApi(
  'users/:userId/settings',
  userSettingsSchema,
  userSettingsInputSchema
);

// Usage in component
function SettingsPage({ userId }: { userId: string }) {
  const settingsApi = userSettingsApi.withParams({ userId });
  
  const { data: settings, loading, refetch } = settingsApi.useFetch();
  const { mutate: updateSettings, isPending } = settingsApi.useUpdate();
  const { mutate: patchSettings } = settingsApi.usePatch();

  const handleSave = async (newSettings: UserSettingsInput) => {
    await updateSettings(newSettings);
  };

  const handleToggleNotifications = async () => {
    await patchSettings({ notificationsEnabled: !settings?.notificationsEnabled });
  };

  if (loading) return <Spinner />;
  
  return (
    <SettingsForm 
      settings={settings} 
      onSave={handleSave}
      onToggle={handleToggleNotifications}
    />
  );
}
```

### Example 2: Dashboard Stats (Read-Only)

```typescript
// Definition
const dashboardStatsApi = createReadOnlyApi(
  'dashboard/stats',
  dashboardStatsSchema,
  {
    cacheTime: 30000, // 30 seconds
    queryParams: {
      dynamic: ['dateRange', 'teamId']
    }
  }
);

// Usage in component
function DashboardStats({ teamId }: { teamId?: string }) {
  const api = teamId 
    ? dashboardStatsApi.withQuery({ teamId })
    : dashboardStatsApi;
    
  const { data: stats, loading, refetch } = api.useFetch();

  if (loading) return <StatsSkeleton />;
  
  return (
    <div>
      <StatsCard title="Total Users" value={stats?.totalUsers} />
      <StatsCard title="Active Today" value={stats?.activeToday} />
      <Button onClick={refetch}>Refresh</Button>
    </div>
  );
}
```

### Example 3: User Profile with Path Params

```typescript
// Definition
const userProfileApi = createReadOnlyApi(
  'users/:userId/profile',
  userProfileSchema,
  {
    queryParams: {
      static: { include: 'avatar,stats' }
    }
  }
);

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: profile, loading } = userProfileApi
    .withParams({ userId })
    .useFetch();

  // ...
}
```

---

## Implementation Details

### `useFetch` Hook

A new hook similar to `useById` but:
- No ID parameter - uses the full path as-is
- No pagination
- Simpler cache key (just the path + query params)

```typescript
function useFetch<T>(
  entity: string,
  endpoint: string,
  options?: {
    cacheTime?: number;
    queryParams?: Record<string, any>;
  }
): UseFetchResult<T>;
```

### Mutation Hooks Behavior

For `useUpdate` and `usePatch` in single-record context:
- **No ID parameter** in mutate function
- Uses the resolved path directly
- Request: `PUT /users/123/settings` (path already complete)

```typescript
// Current useUpdate for list-based API
const { mutate } = todosApi.useUpdate();
await mutate(data, todoId); // ID required

// New useUpdate for single-record API
const { mutate } = settingsApi.useUpdate();
await mutate(data); // No ID - path is the identifier
```

---

## Cache Key Strategy

For single-record APIs, cache keys are simpler:

```typescript
// List-based API cache keys
'todos'                    // List
'todos/123'               // Single item by ID

// Single-record API cache keys
'users/123/settings'      // Single record (full path)
'dashboard/stats'         // Single record
'dashboard/stats?teamId=5' // With query params
```

---

## Type Extraction Helpers

```typescript
// Extract entity type from single record API
export type ExtractSingleRecordType<T> = T extends { useFetch: () => { data: infer U } }
  ? U
  : never;

// Usage
type Settings = ExtractSingleRecordType<typeof userSettingsApi>;
```

---

## Migration Path

Existing code using `createDomainApi` for single-record patterns:

```typescript
// Before (awkward usage)
const settingsApi = createDomainApi('users/:userId/settings', ...);
// Had to use useById without ID or useList expecting single item

// After (clear intent)
const settingsApi = createSingleRecordApi('users/:userId/settings', ...);
const { data } = settingsApi.useFetch(); // Clear single-record semantics
```

---

## Questions for Discussion

1. **Naming**: `useFetch` vs `useGet` vs `useRecord` vs `useSingle`?
   - `useFetch` - Generic, clear intent
   - `useGet` - HTTP-centric
   - `useRecord` - Domain-centric
   
2. **Should `createReadOnlyApi` support `refetchInterval`?**
   - Useful for dashboards that need auto-refresh
   - Could add `refetchInterval` to config

3. **Should we add `useDelete` to `createSingleRecordApi`?**
   - Some settings might be deletable (reset to defaults)
   - Could add optional `allowDelete: true` in config

4. **Cache invalidation between related APIs?**
   - If updating settings affects dashboard stats, how to handle?
   - Manual `refetch()` or some invalidation mechanism?

---

## File Structure

```
src/factory/
├── createDomainApi.ts        # Existing - list-based CRUD
├── createSingleRecordApi.ts  # New - single record CRUD
├── createReadOnlyApi.ts      # New - read-only single record
└── index.ts                  # Exports all factories

src/hooks/
├── useFetch.ts               # New - single record fetch
└── ...existing hooks
```

---

## Summary of Differences

| Feature | `createDomainApi` | `createSingleRecordApi` | `createReadOnlyApi` |
|---------|-------------------|-------------------------|---------------------|
| `useList` | ✅ | ❌ | ❌ |
| `useById` | ✅ | ❌ | ❌ |
| `useFetch` | ❌ | ✅ | ✅ |
| `useCreate` | ✅ | ❌ | ❌ |
| `useUpdate` | ✅ (with ID) | ✅ (no ID) | ❌ |
| `usePatch` | ✅ (with ID) | ✅ (no ID) | ❌ |
| `useDelete` | ✅ | ❌ | ❌ |
| `withParams` | ✅ | ✅ | ✅ |
| `withQuery` | ✅ | ✅ | ✅ |

---

## Next Steps

1. Review and approve RFC
2. Implement `useFetch` hook
3. Implement `createSingleRecordApi` factory
4. Implement `createReadOnlyApi` factory
5. Add tests
6. Update documentation
7. Add examples
