import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postsApi, usersApi, categoriesApi, commentsApi } from '../api';
import { PostWithRelations } from '../api';

interface PostListProps {
  onDataChange?: () => void; // Callback to notify parent of data changes
}

export function PostList({ onDataChange }: PostListProps) {
  const {
    data: posts = [],
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = postsApi.useList();
  const {
    data: users = [],
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = usersApi.useList();
  const {
    data: categories = [],
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = categoriesApi.useList();
  const {
    data: comments = [],
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = commentsApi.useList();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('published');

  const isLoading = postsLoading || usersLoading || categoriesLoading || commentsLoading;
  const hasError = postsError || usersError || categoriesError || commentsError;

  // Manual refresh function - needed because no global state sync
  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refetchPosts(), refetchUsers(), refetchCategories(), refetchComments()]);
    onDataChange?.();
  }, [refetchPosts, refetchUsers, refetchCategories, refetchComments, onDataChange]);

  // Safely handle undefined data
  const safePosts = posts || [];
  const safeUsers = users || [];
  const safeCategories = categories || [];
  const safeComments = comments || [];

  // Enrich posts with relations
  const enrichedPosts: PostWithRelations[] = safePosts.map(post => ({
    ...post,
    author: safeUsers.find(user => user.id === post.authorId),
    category: safeCategories.find(cat => cat.id === post.categoryId),
    commentCount: safeComments.filter(comment => comment.postId === post.id).length,
  }));

  // Filter posts
  const filteredPosts = enrichedPosts.filter(post => {
    if (filter === 'published') return post.published;
    if (filter === 'draft') return !post.published;
    return true;
  });

  // Sort by creation date (newest first)
  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (isLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (hasError) {
    return (
      <div className="empty-state">
        <h3>❌ Error Loading Posts</h3>
        <p>Failed to load blog posts. Please try again.</p>
        <button onClick={handleRefreshAll} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h2>Blog Posts</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleRefreshAll} className="btn btn-secondary">
            Refresh All Data
          </button>
          <Link to="/posts/new" className="btn btn-primary">
            Write New Post
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem',
        }}
      >
        <button
          className={`btn btn-small ${filter === 'published' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('published')}
        >
          Published ({enrichedPosts.filter(p => p.published).length})
        </button>
        <button
          className={`btn btn-small ${filter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({enrichedPosts.filter(p => !p.published).length})
        </button>
        <button
          className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All ({enrichedPosts.length})
        </button>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts found</h3>
          <p>
            {filter === 'all'
              ? 'Start by creating your first blog post!'
              : `No ${filter} posts yet.`}
          </p>
          <Link to="/posts/new" className="btn btn-primary">
            Create First Post
          </Link>
        </div>
      ) : (
        <div className="post-list">
          {sortedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onPostChange={handleRefreshAll} // Pass callback to refresh data
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: PostWithRelations;
  onPostChange?: () => void; // Callback when post is modified
}

function PostCard({ post, onPostChange }: PostCardProps) {
  const { mutate: updatePost } = postsApi.useUpdate(post.id);
  const { mutate: deletePost } = postsApi.useDelete(post.id);

  const handleTogglePublished = async () => {
    await updatePost({
      ...post,
      published: !post.published,
    });
    // Manual callback to refresh other components
    onPostChange?.();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost();
      // Manual callback to refresh other components
      onPostChange?.();
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <article className="card post-preview fade-in">
      <div className="card-header">
        <div>
          {post.published ? (
            <Link
              to={`/posts/${post.id}`}
              className="card-title"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {post.title}
            </Link>
          ) : (
            <span className="card-title" style={{ color: '#6b7280' }}>
              {post.title}
            </span>
          )}
          <div className="card-meta">
            By {post.author?.name || 'Unknown Author'} • {formatDate(post.createdAt)} •{' '}
            {post.category?.name || 'Uncategorized'}
            {!post.published && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              >
                DRAFT
              </span>
            )}
          </div>
        </div>
        <div className="card-actions">
          <button
            onClick={handleTogglePublished}
            className={`btn btn-small ${post.published ? 'btn-secondary' : 'btn-success'}`}
          >
            {post.published ? 'Unpublish' : 'Publish'}
          </button>
          <Link to={`/posts/${post.id}/edit`} className="btn btn-small btn-secondary">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-small btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="card-content">
        {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}
        >
          <span>{post.commentCount || 0} comments</span>
          <Link to={`/posts/${post.id}`} style={{ color: '#667eea', textDecoration: 'none' }}>
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
