import { commentsApi } from '../api';
import { CommentWithAuthor } from '../api';

interface CommentProps {
  comment: CommentWithAuthor;
  onDelete?: () => void;
}

export function Comment({ comment, onDelete }: CommentProps) {
  const { mutate: deleteComment } = commentsApi.useDelete(comment.id);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment();
      onDelete?.();
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="comment fade-in">
      <div className="comment-header">
        <span className="comment-author">{comment.author?.name || 'Anonymous'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          <button
            onClick={handleDelete}
            className="btn btn-small btn-danger"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="comment-content">{comment.content}</div>
    </div>
  );
}
