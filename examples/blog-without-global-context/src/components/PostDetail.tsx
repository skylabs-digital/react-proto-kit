import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsApi, usersApi, categoriesApi, commentsApi } from '../api';
import type { CommentWithAuthor } from '../types';

interface PostDetailProps {
  onDataChange?: () => void; // Callback to notify parent of data changes
}

export function PostDetail({ onDataChange }: PostDetailProps) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');

  const { data: post, loading: postLoading, refetch: refetchPost } = postsApi.useById!(slug || '');
  const { data: users = [], refetch: refetchUsers } = usersApi.useList!();
  const { data: categories = [], refetch: refetchCategories } = categoriesApi.useList!();
  const { data: comments = [], refetch: refetchComments } = commentsApi.useList!();
  const { mutate: createComment, loading: commentLoading } = commentsApi.useCreate!();
  const { mutate: deletePost } = postsApi.useDelete!(post?.id || '');
  const { mutate: deleteComment } = commentsApi.useDelete!('');

  // Manual refresh function - needed because no global state sync
  const handleRefreshAll = useCallback(async () => {
    await Promise.all([
      refetchPost(),
      refetchUsers(),
      refetchCategories(),
      refetchComments(),
    ]);
    onDataChange?.();
  }, [refetchPost, refetchUsers, refetchCategories, refetchComments, onDataChange]);

  if (postLoading) {
    return <div className="loading">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="empty-state">
        <h3>Post not found</h3>
        <p>The post you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const author = users.find(user => user.id === post.authorId);
  const category = categories.find(cat => cat.id === post.categoryId);
  
  // Get comments for this post with author info
  const postComments: CommentWithAuthor[] = comments
    .filter(comment => comment.postId === post.id)
    .map(comment => ({
      ...comment,
      author: users.find(user => user.id === comment.authorId),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await createComment({
      content: commentText.trim(),
      postId: post.id,
      authorId: users[0]?.id || 'default-author', // In a real app, this would be the current user
    });
    setCommentText('');
    // Manual refresh to update comment count and lists
    await handleRefreshAll();
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      await deletePost();
      onDataChange?.(); // Notify parent before navigation
      navigate('/');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
      // Manual refresh to update comment count and lists
      await handleRefreshAll();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="content">
      <article className="card fade-in">
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {post.title}
            </h1>
            <div className="card-meta">
              By {author?.name || 'Unknown Author'} • {formatDate(post.createdAt)} • {category?.name || 'Uncategorized'}
              {!post.published && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.25rem 0.5rem', 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem' 
                }}>
                  DRAFT
                </span>
              )}
            </div>
          </div>
          <div className="card-actions">
            <button
              onClick={handleRefreshAll}
              className="btn btn-small btn-secondary"
            >
              Refresh
            </button>
            <Link to={`/posts/${post.slug}/edit`} className="btn btn-small btn-secondary">
              Edit
            </Link>
            <button
              onClick={handleDeletePost}
              className="btn btn-small btn-danger"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="card-content">
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.8',
            fontSize: '1.1rem'
          }}>
            {post.content}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="comments-section">
        <div className="comments-header">
          <h3>Comments ({postComments.length})</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Note: Comments don't auto-refresh. Use the refresh button above to see new comments.
          </p>
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="card" style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label htmlFor="comment" className="form-label">
              Add a comment
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="form-textarea"
              placeholder="Share your thoughts..."
              rows={4}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={commentLoading || !commentText.trim()}
          >
            {commentLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        {postComments.length === 0 ? (
          <div className="empty-state">
            <h4>No comments yet</h4>
            <p>Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div>
            {postComments.map(comment => (
              <div key={comment.id} className="comment fade-in">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.author?.name || 'Anonymous'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn btn-small btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="comment-content">
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/" className="btn btn-secondary">
          ← Back to Posts
        </Link>
      </div>
    </div>
  );
}
