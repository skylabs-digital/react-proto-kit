import React from 'react';
import { usersApi, categoriesApi, postsApi, commentsApi } from '../api';

interface SidebarProps {
  onDataChange?: () => void; // Callback to notify parent of data changes
}

export function BlogStats({ onDataChange }: SidebarProps) {
  const {
    data: posts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = postsApi.useList!();
  const {
    data: comments,
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = commentsApi.useList!();
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = usersApi.useList!();
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = categoriesApi.useList!();

  const isLoading = postsLoading || commentsLoading || usersLoading || categoriesLoading;
  const hasError = postsError || commentsError || usersError || categoriesError;

  // Safely handle undefined data
  const safePosts = posts || [];
  const safeComments = comments || [];
  const safeUsers = users || [];
  const safeCategories = categories || [];
  const publishedPosts = safePosts.filter(post => post.published);

  // Manual refresh function that needs to be called when data changes
  const handleRefresh = async () => {
    await Promise.all([refetchPosts(), refetchComments(), refetchUsers(), refetchCategories()]);
    onDataChange?.();
  };

  return (
    <div className="widget">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
          Blog Statistics
        </h3>
        <button
          onClick={handleRefresh}
          className="btn btn-small btn-secondary"
          style={{ fontSize: '0.75rem' }}
        >
          Refresh
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{isLoading ? '-' : publishedPosts.length}</div>
          <div className="stat-label">Posts</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{isLoading ? '-' : safeComments.length}</div>
          <div className="stat-label">Comments</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{isLoading ? '-' : safeUsers.length}</div>
          <div className="stat-label">Authors</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{isLoading ? '-' : safeCategories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
      </div>
      {hasError && (
        <div
          style={{
            padding: '1rem',
            color: '#ef4444',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          ⚠️ Some data failed to load
        </div>
      )}
    </div>
  );
}

export function CategoriesList({ onDataChange }: SidebarProps) {
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = categoriesApi.useList!();
  const {
    data: posts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = postsApi.useList!();

  const isLoading = categoriesLoading || postsLoading;
  const hasError = categoriesError || postsError;

  // Safely handle undefined data
  const safeCategories = categories || [];
  const safePosts = posts || [];

  const getCategoryPostCount = (categoryId: string) => {
    return safePosts.filter(post => post.categoryId === categoryId && post.published).length;
  };

  const handleRefresh = async () => {
    await Promise.all([refetchCategories(), refetchPosts()]);
    onDataChange?.();
  };

  return (
    <div className="widget">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
          Categories
        </h3>
        <button
          onClick={handleRefresh}
          className="btn btn-small btn-secondary"
          style={{ fontSize: '0.75rem' }}
        >
          Refresh
        </button>
      </div>
      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
          Loading categories...
        </div>
      ) : hasError ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
          ❌ Error loading categories
        </div>
      ) : (
        <ul className="category-list">
          {safeCategories.map(category => (
            <li key={category.id} className="category-item">
              <a href={`#category-${category.slug}`} className="category-link">
                {category.name}
              </a>
              <span className="category-count">{getCategoryPostCount(category.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecentActivity({ onDataChange }: SidebarProps) {
  const {
    data: comments,
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = commentsApi.useList!();
  const {
    data: posts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = postsApi.useList!();

  const isLoading = commentsLoading || postsLoading;
  const hasError = commentsError || postsError;

  // Safely handle undefined data
  const safeComments = comments || [];
  const safePosts = posts || [];

  // Get recent comments (last 5)
  const recentComments = safeComments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get recent posts (last 3)
  const recentPosts = safePosts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleRefresh = async () => {
    await Promise.all([refetchComments(), refetchPosts()]);
    onDataChange?.();
  };

  return (
    <div className="widget">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
          Recent Activity
        </h3>
        <button
          onClick={handleRefresh}
          className="btn btn-small btn-secondary"
          style={{ fontSize: '0.75rem' }}
        >
          Refresh
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading recent activity...</div>
        ) : hasError ? (
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            ❌ Error loading recent activity
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#374151' }}>
                Latest Posts
              </h4>
              {recentPosts.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No posts yet</p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {recentPosts.map(post => (
                    <li key={post.id} style={{ marginBottom: '0.5rem' }}>
                      <a
                        href={`#post-${post.slug}`}
                        style={{
                          color: '#374151',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          display: 'block',
                          padding: '0.25rem 0',
                        }}
                      >
                        {post.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#374151' }}>
                Latest Comments
              </h4>
              {recentComments.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No comments yet</p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {recentComments.map(comment => (
                    <li key={comment.id} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {comment.content.substring(0, 50)}
                        {comment.content.length > 50 ? '...' : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
