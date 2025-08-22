# Blog Platform - With Global Context

This is an advanced blog platform demonstrating the full power of Global Context with complex entity relationships and real-time synchronization across multiple components.

## Features

- ✅ **Multi-Entity Global State**: Posts, Comments, Users, and Categories all synchronized
- ✅ **Intelligent Invalidation**: Comments invalidate posts, posts invalidate comments
- ✅ **Real-time Updates**: All components update automatically across the entire app
- ✅ **Complex Relations**: Posts with authors, categories, and comment counts
- ✅ **Optimistic Updates**: Instant UI feedback for all operations
- ✅ **Smart Caching**: Different cache times per entity type
- ✅ **Full CRUD Operations**: Create, read, update, delete for all entities
- ✅ **Routing Integration**: Works seamlessly with React Router

## Key Benefits of Global Context

1. **Automatic Cross-Component Sync**: 
   - Create a comment → Post detail updates comment count instantly
   - Delete a post → Sidebar stats update automatically
   - Publish/unpublish → All views reflect changes immediately

2. **Intelligent Cache Invalidation**:
   - Comments invalidate posts (for comment counts)
   - Posts invalidate comments (for post references)
   - Smart cache timing per entity type

3. **Zero Manual State Management**:
   - No prop drilling
   - No manual refresh calls
   - No callback chains

## Architecture Highlights

### API Configuration with Relations
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
  cacheTime: 3 * 60 * 1000, // 3 minutes (more dynamic)
});
```

### Real-time Component Synchronization
- **Sidebar Stats**: Updates automatically when any entity changes
- **Post List**: Reflects new posts, status changes, deletions instantly
- **Comment Counts**: Update across all components when comments are added/removed
- **Category Counts**: Automatically recalculate when posts are published/unpublished

## Running the Example

```bash
cd examples/blog-with-global-context
npm install
npm run dev
```

## Component Structure

- **Header**: Navigation with active state management
- **PostList**: Filterable list with real-time updates
- **PostForm**: Create/edit with category selection
- **PostDetail**: Full post view with comments
- **Sidebar**: Live statistics and activity feeds
- **Comments**: Real-time comment system

## Global Context Magic in Action

1. **Create a Post**: 
   - Sidebar stats update instantly
   - Post list shows new post immediately
   - Category counts adjust automatically

2. **Add a Comment**:
   - Post detail shows new comment instantly
   - Sidebar activity feed updates
   - Post list comment counts increment
   - All without manual refreshes!

3. **Delete Content**:
   - All references disappear immediately
   - Statistics recalculate automatically
   - Related data stays consistent

This example showcases how Global Context eliminates complex state management in real-world applications with multiple related entities and cross-component dependencies.
