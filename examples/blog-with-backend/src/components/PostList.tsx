import { Link } from 'react-router-dom';
import { useState } from 'react';
import { postsApi, categoriesApi, usersApi } from '../api';
import { useUrlSelector } from '../../../../src';

export function PostList() {
  const { data: posts, loading, error } = postsApi.useList();
  const { data: categories } = categoriesApi.useList();
  const { data: users } = usersApi.useList();
  const [categoryFilter, setCategoryFilter] = useUrlSelector('category', (value: string) => value, {
    multiple: false,
  });
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('published');
  const { mutate: updatePost } = postsApi.useUpdate();

  // Handle loading state
  if (loading) {
    return <div className="loading">Loading posts from server...</div>;
  }

  // Handle error state
  if (error) {
    return (
      <div className="empty-state">
        <h3>❌ Error Loading Posts</h3>
        <p>Failed to connect to the backend server.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Make sure the Express server is running on port 3002
        </p>
      </div>
    );
  }

  // Safely handle undefined data
  const safePosts = posts || [];
  const safeCategories = categories || [];
  const safeUsers = users || [];

  // Filter posts by publication status
  const statusFilteredPosts = safePosts.filter(post => {
    switch (filter) {
      case 'published':
        return post.published;
      case 'draft':
        return !post.published;
      case 'all':
      default:
        return true;
    }
  });

  // Filter posts by category and sort
  const filteredPosts = statusFilteredPosts
    .filter(post => !categoryFilter || post.categoryId === categoryFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Helper functions
  const getCategoryName = (categoryId: string) => {
    const category = safeCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getAuthorName = (authorId: string) => {
    const author = safeUsers.find(u => u.id === authorId);
    return author?.name || 'Unknown Author';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleTogglePublished = async (post: any) => {
    await updatePost(
      {
        ...post,
        published: !post.published,
      },
      post.id
    );
  };

  return (
    <div className="content">
      <div className="content-header">
        <h2>Latest Posts</h2>
        <Link to="/posts/new" className="btn btn-primary">
          Write New Post
        </Link>
      </div>

      {/* Status Filter */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
          onClick={() => setFilter('published')}
        >
          Published ({safePosts.filter(p => p.published).length})
        </button>
        <button
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({safePosts.filter(p => !p.published).length})
        </button>
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Posts ({safePosts.length})
        </button>
      </div>

      {/* Category Filter */}
      {safeCategories.length > 0 && (
        <div className="filter-tabs">
          <button
            className={`filter-tab ${!categoryFilter ? 'active' : ''}`}
            onClick={() => setCategoryFilter('')}
          >
            All Categories ({statusFilteredPosts.length})
          </button>
          {safeCategories.map(category => {
            const count = statusFilteredPosts.filter(p => p.categoryId === category.id).length;
            return (
              <button
                key={category.id}
                className={`filter-tab ${categoryFilter === category.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(category.id)}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts found</h3>
          <p>
            {categoryFilter
              ? `No published posts in this category yet.`
              : 'No published posts yet. Be the first to write one!'}
          </p>
          <Link to="/posts/new" className="btn btn-primary">
            Write First Post
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map(post => (
            <article key={post.id} className="post-card">
              <div className="post-meta">
                <span className="post-category">{getCategoryName(post.categoryId)}</span>
                <span className="post-date">{formatDate(post.createdAt)}</span>
              </div>

              <h3 className="post-title">
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </h3>

              {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}

              <div className="post-footer">
                <div className="post-author">By {getAuthorName(post.authorId)}</div>
                <div className="post-actions">
                  <button
                    onClick={() => handleTogglePublished(post)}
                    className={`btn btn-sm ${post.published ? 'btn-secondary' : 'btn-success'}`}
                  >
                    {post.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link to={`/posts/${post.id}`} className="btn btn-secondary btn-sm">
                    Read More
                  </Link>
                  <Link to={`/posts/${post.id}/edit`} className="btn btn-outline btn-sm">
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
