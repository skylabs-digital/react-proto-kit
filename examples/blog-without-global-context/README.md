# Blog Platform - Without Global Context

This is an advanced blog platform demonstrating the challenges and complexity of managing state **without** Global Context. Compare this with the Global Context version to see the dramatic difference in code complexity and user experience.

## Features

- ❌ **Manual State Management**: Each component manages its own independent state
- ❌ **Manual Refresh Required**: Components don't auto-sync, need explicit refresh buttons
- ❌ **Callback Chains**: Complex callback patterns to notify components of changes
- ❌ **Stale Data Issues**: Components can show outdated information
- ❌ **Poor UX**: Users must manually refresh to see updates
- ✅ **Same Core Functionality**: All CRUD operations work, but with more complexity

## Key Problems Without Global Context

1. **No Automatic Synchronization**: 
   - Create a comment → Post detail doesn't update comment count automatically
   - Delete a post → Sidebar stats remain stale until manual refresh
   - Publish/unpublish → Other views don't reflect changes until refresh

2. **Manual Refresh Everywhere**:
   - Every component has its own "Refresh" button
   - Users must remember to refresh to see current data
   - Poor user experience with stale information

3. **Complex State Coordination**:
   - Callback chains: `onDataChange`, `onPostChange`, etc.
   - Key-based re-rendering tricks: `key={refreshKey}`
   - Manual `refetch()` calls throughout the codebase

## Architecture Challenges

### API Configuration (No Global State)
```typescript
export const postsApi = createDomainApi('posts', postSchema, {
  // No globalState flag - each component has independent state
  cacheTime: 5 * 60 * 1000,
});
```

### Manual Synchronization Required
```typescript
// Every component needs refresh callbacks
const handleDataChange = useCallback(() => {
  setRefreshKey(prev => prev + 1); // Force re-render
}, []);

// Manual refetch calls everywhere
const handleRefreshAll = useCallback(async () => {
  await Promise.all([
    refetchPosts(),
    refetchUsers(), 
    refetchCategories(),
    refetchComments(),
  ]);
  onDataChange?.(); // Notify parent
}, [refetchPosts, refetchUsers, refetchCategories, refetchComments, onDataChange]);
```

### Component Complexity
- **Sidebar Components**: Each has its own refresh button and manual data fetching
- **PostList**: Requires callback to notify sidebar of changes
- **PostDetail**: Manual refresh needed to see new comments
- **Forms**: Must notify parent components of data changes

## Running the Example

```bash
cd examples/blog-without-global-context
npm install
npm run dev
```

## User Experience Issues

1. **Create a Post**: 
   - Sidebar stats don't update automatically
   - Must click "Refresh" buttons to see changes
   - Post list might not show new post immediately

2. **Add a Comment**:
   - Comment count doesn't update in post list
   - Sidebar activity doesn't refresh
   - Must manually refresh multiple components

3. **Delete Content**:
   - Stale references remain visible
   - Statistics don't recalculate automatically
   - Inconsistent data across components

## Code Complexity Comparison

**Without Global Context:**
- Manual refresh buttons everywhere
- Complex callback chains
- Key-based re-rendering tricks
- Explicit `refetch()` calls
- State coordination logic
- Poor user experience

**With Global Context:**
- Zero manual refresh buttons
- No callback chains needed
- Automatic synchronization
- Clean, simple components
- Excellent user experience

## Conclusion

This example clearly demonstrates why Global Context is essential for complex applications with multiple related entities. The manual state management approach leads to:

- **3x more code complexity**
- **Poor user experience** 
- **Maintenance nightmares**
- **Inconsistent data states**
- **Developer frustration**

Compare this with the Global Context version to see how much simpler and better the experience becomes with proper state management.
