import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi, usersApi, categoriesApi, commentsApi, Post, PostWithRelations } from '../api';

export function PostList() {
  const { data: posts, loading: postsLoading, error: postsError } = postsApi.useList();
  const { data: users, loading: usersLoading, error: usersError } = usersApi.useList();
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = categoriesApi.useList();
  const { data: comments, loading: commentsLoading, error: commentsError } = commentsApi.useList();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('published');
  const { mutate: updatePost } = postsApi.useUpdate();
  const { mutate: deletePost } = postsApi.useDelete();

  const isLoading = postsLoading || usersLoading || categoriesLoading || commentsLoading;
  const hasError = postsError || usersError || categoriesError || commentsError;

  // Safely handle undefined data
  const safePosts = posts || [];
  const safeUsers = users || [];
  const safeCategories = categories || [];
  const safeComments = comments || [];

  // Create PostWithRelations objects
  const postsWithRelations: PostWithRelations[] = safePosts.map(post => {
    const author = safeUsers.find(user => user.id === post.authorId);
    const category = safeCategories.find(cat => cat.id === post.categoryId);
    const postComments = safeComments.filter(comment => comment.postId === post.id);

    return {
      ...post,
      author,
      category,
      comments: postComments,
      commentCount: postComments.length,
    };
  });

  // Filter posts based on current filter
  const filteredPosts = postsWithRelations.filter(post => {
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

  // Sort posts by creation date (newest first)
  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleTogglePublished = async (post: Post) => {
    await updatePost({
      ...post,
      published: !post.published,
    });
  };

  const handleDelete = async (post: Post) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      // Test dynamic ID by passing the ID in the data payload instead of endpoint
      await deletePost(undefined, post.id);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (hasError) {
    return <div className="error">Error loading posts. Please try again.</div>;
  }

  return (
    <div className="content">
      <div className="content-header">
        <h2>Posts</h2>
        <Link to="/posts/new" className="btn btn-primary">
          New Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
          onClick={() => setFilter('published')}
        >
          Published ({postsWithRelations.filter(p => p.published).length})
        </button>
        <button
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({postsWithRelations.filter(p => !p.published).length})
        </button>
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({postsWithRelations.length})
        </button>
      </div>

      {/* Posts List */}
      {sortedPosts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts found</h3>
          <p>
            {filter === 'published' && 'No published posts yet.'}
            {filter === 'draft' && 'No draft posts yet.'}
            {filter === 'all' && 'No posts yet.'}
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
              onTogglePublished={handleTogglePublished}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: PostWithRelations;
  onTogglePublished: (post: Post) => void;
  onDelete: (post: Post) => void;
}

function PostCard({ post, onTogglePublished, onDelete }: PostCardProps) {
  const handleTogglePublished = () => {
    onTogglePublished(post);
  };

  const handleDelete = () => {
    onDelete(post);
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
          {' • '}
          {formatDate(post.createdAt)}
          {' • '}
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
      <div className="card-content">
        <p className="card-excerpt">{post.excerpt || 'No excerpt available.'}</p>
        <div className="card-footer">
          <span>{post.commentCount || 0} comments</span>
          <Link to={`/posts/${post.id}`} style={{ color: '#667eea', textDecoration: 'none' }}>
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
