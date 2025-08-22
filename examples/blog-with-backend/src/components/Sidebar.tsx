import React from 'react';
import { postsApi, categoriesApi, commentsApi } from '../api';

export function BlogStats() {
  const { data: posts, loading: postsLoading, error: postsError } = postsApi.useList();
  const { data: categories, loading: categoriesLoading } = categoriesApi.useList();
  const { data: comments, loading: commentsLoading } = commentsApi.useList();

  // Handle loading state
  if (postsLoading || categoriesLoading || commentsLoading) {
    return (
      <div className="sidebar-section">
        <h3>📊 Blog Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">-</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">-</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">-</div>
            <div className="stat-label">Comments</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">-</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (postsError) {
    return (
      <div className="sidebar-section">
        <h3>📊 Blog Statistics</h3>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
          <p>❌ Error connecting to backend</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Make sure the Express server is running on port 3002
          </p>
        </div>
      </div>
    );
  }

  // Safely handle undefined data
  const safePosts = posts || [];
  const safeCategories = categories || [];
  const safeComments = comments || [];
  const publishedPosts = safePosts.filter(post => post.published).length;

  return (
    <div className="sidebar-section">
      <h3>📊 Blog Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{safePosts.length}</div>
          <div className="stat-label">Posts</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{safeCategories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{safeComments.length}</div>
          <div className="stat-label">Comments</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{publishedPosts}</div>
          <div className="stat-label">Published</div>
        </div>
      </div>
    </div>
  );
}

export function CategoriesList() {
  const { data: categories, loading, error } = categoriesApi.useList();
  const { data: posts } = postsApi.useList();

  if (loading) {
    return (
      <div className="sidebar-section">
        <h3>📂 Categories</h3>
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-section">
        <h3>📂 Categories</h3>
        <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>Error loading categories</div>
      </div>
    );
  }

  const safeCategories = categories || [];
  const safePosts = posts || [];

  // Count posts per category
  const categoryPostCounts = safeCategories.map(category => ({
    ...category,
    postCount: safePosts.filter(post => post.categoryId === category.id && post.published).length,
  }));

  return (
    <div className="sidebar-section">
      <h3>📂 Categories</h3>
      {categoryPostCounts.length === 0 ? (
        <p className="empty-message">No categories yet</p>
      ) : (
        <ul className="categories-list">
          {categoryPostCounts.map(category => (
            <li key={category.id} className="category-item">
              <span className="category-name">{category.name}</span>
              <span className="category-count">({category.postCount})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecentActivity() {
  const { data: posts, loading: postsLoading } = postsApi.useList();
  const { data: comments, loading: commentsLoading } = commentsApi.useList();

  if (postsLoading || commentsLoading) {
    return (
      <div className="sidebar-section">
        <h3>🕒 Recent Activity</h3>
        <div className="loading">Loading activity...</div>
      </div>
    );
  }

  const safePosts = posts || [];
  const safeComments = comments || [];

  // Combine and sort recent activity
  const recentPosts = safePosts
    .filter(post => post.published)
    .map(post => ({
      type: 'post' as const,
      id: post.id,
      title: post.title,
      date: new Date(post.createdAt),
    }));

  const recentComments = safeComments.map(comment => ({
    type: 'comment' as const,
    id: comment.id,
    title: `Comment on post`,
    date: new Date(comment.createdAt),
  }));

  const allActivity = [...recentPosts, ...recentComments]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="sidebar-section">
      <h3>🕒 Recent Activity</h3>
      {allActivity.length === 0 ? (
        <p className="empty-message">No recent activity</p>
      ) : (
        <ul className="activity-list">
          {allActivity.map(item => (
            <li key={`${item.type}-${item.id}`} className="activity-item">
              <div className="activity-icon">{item.type === 'post' ? '📝' : '💬'}</div>
              <div className="activity-content">
                <div className="activity-title">{item.title}</div>
                <div className="activity-date">{item.date.toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
