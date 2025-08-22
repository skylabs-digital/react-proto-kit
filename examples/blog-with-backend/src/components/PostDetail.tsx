import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsApi, categoriesApi, usersApi, commentsApi } from '../api';
import { useFormData } from '../../../../src';
import { commentSchema } from '../api';

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, loading: postLoading, error: postError } = postsApi.useById(id || '');
  const { data: categories } = categoriesApi.useList();
  const { data: users } = usersApi.useList();
  const { data: comments } = commentsApi.useList();
  const { mutate: deletePost, loading: deleteLoading } = postsApi.useDelete(post?.id || '');
  const { mutate: createComment, loading: commentLoading } = commentsApi.useCreate();

  // Comment form - use the input schema directly
  const commentFormSchema = commentSchema;
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(
    commentFormSchema,
    {
      content: '',
      authorId: 'author-1', // Default author
      postId: post?.id || '',
    }
  );

  // Update postId when post loads
  React.useEffect(() => {
    if (post) {
      reset({
        content: '',
        authorId: 'author-1',
        postId: post.id,
      });
    }
  }, [post, reset]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost();
        navigate('/');
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const onCommentSubmit = handleSubmit(async data => {
    try {
      await createComment(data);
      reset({
        content: '',
        authorId: 'author-1',
        postId: post?.id || '',
      });
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  });

  if (postLoading) {
    return <div className="loading">Loading post from server...</div>;
  }

  if (postError || !post) {
    return (
      <div className="empty-state">
        <h3>❌ Post Not Found</h3>
        <p>The requested post could not be found or failed to load from the server.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Make sure the Express server is running on port 3002
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  // Helper functions
  const safeCategories = categories || [];
  const safeUsers = users || [];
  const safeComments = comments || [];

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter comments for this post
  const postComments = safeComments
    .filter(comment => comment.postId === post.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="content">
      <article className="post-detail">
        <header className="post-header">
          <div className="post-meta">
            <span className="post-category">{getCategoryName(post.categoryId)}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
            {!post.published && <span className="post-status draft">Draft</span>}
          </div>

          <h1 className="post-title">{post.title}</h1>

          <div className="post-author">By {getAuthorName(post.authorId)}</div>

          <div className="post-actions">
            <Link to={`/posts/${post.id}/edit`} className="btn btn-secondary btn-sm">
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        </header>

        <div className="post-content">
          {post.excerpt && (
            <div className="post-excerpt">
              <em>{post.excerpt}</em>
            </div>
          )}

          <div className="post-body">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="comments-section">
        <h3>Comments ({postComments.length})</h3>

        {/* Comment Form */}
        <form onSubmit={onCommentSubmit} className="comment-form">
          <div className="form-field">
            <label htmlFor="comment-content">Add a comment</label>
            <textarea
              id="comment-content"
              name="content"
              value={values.content || ''}
              onChange={handleInputChange}
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Share your thoughts..."
              rows={4}
              disabled={commentLoading}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={commentLoading || !values.content?.trim()}
          >
            {commentLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        {postComments.length === 0 ? (
          <div className="empty-comments">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="comments-list">
            {postComments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{getAuthorName(comment.authorId)}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="post-navigation">
        <Link to="/" className="btn btn-secondary">
          ← Back to Posts
        </Link>
      </div>
    </div>
  );
}
