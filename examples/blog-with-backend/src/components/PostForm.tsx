import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, categoriesApi } from '../api';
import { useFormData } from '../../../../src';
import { postSchema } from '../api';

export function PostForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Fetch existing post if editing
  const { data: existingPost, loading: postLoading } =
    isEditing && id ? postsApi.useById(id) : { data: null, loading: false };

  const { data: categories, loading: categoriesLoading } = categoriesApi.useList();
  const { mutate: createPost, loading: createLoading } = postsApi.useCreate();
  const { mutate: updatePost, loading: updateLoading } = postsApi.useUpdate(existingPost?.id || '');

  // Form schema for validation - use the input schema directly
  const formSchema = postSchema;

  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(formSchema, {
    title: existingPost?.title || '',
    slug: existingPost?.slug || '',
    content: existingPost?.content || '',
    excerpt: existingPost?.excerpt || '',
    authorId: existingPost?.authorId || 'author-1', // Default author
    categoryId: existingPost?.categoryId || '',
    published: existingPost?.published || false,
  });

  // Update form when existing post loads
  React.useEffect(() => {
    if (existingPost && isEditing) {
      reset({
        title: existingPost.title,
        slug: existingPost.slug,
        content: existingPost.content,
        excerpt: existingPost.excerpt || '',
        authorId: existingPost.authorId,
        categoryId: existingPost.categoryId,
        published: existingPost.published,
      });
    }
  }, [existingPost, isEditing, reset]);

  const onSubmit = handleSubmit(async data => {
    try {
      if (isEditing && existingPost) {
        await updatePost(data);
      } else {
        await createPost(data);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  });

  const handleCancel = () => {
    navigate('/');
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    // Auto-generate slug if not editing or if slug is empty
    if (!isEditing || !values.slug) {
      const newSlug = generateSlug(e.target.value);
      handleInputChange({
        target: { name: 'slug', value: newSlug },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  if (postLoading || categoriesLoading) {
    return <div className="loading">Loading...</div>;
  }

  const safeCategories = categories || [];
  const isLoading = createLoading || updateLoading;

  return (
    <div className="content">
      <div className="content-header">
        <h2>{isEditing ? 'Edit Post' : 'Write New Post'}</h2>
      </div>

      <form onSubmit={onSubmit} className="post-form">
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={values.title || ''}
              onChange={handleTitleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter post title..."
              disabled={isLoading}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="slug">Slug *</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={values.slug || ''}
              onChange={handleInputChange}
              className={`form-input ${errors.slug ? 'error' : ''}`}
              placeholder="post-url-slug"
              disabled={isLoading}
            />
            {errors.slug && <span className="error-message">{errors.slug}</span>}
            <small className="form-help">URL-friendly version of the title</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="categoryId">Category *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={values.categoryId || ''}
              onChange={handleInputChange}
              className={`form-select ${errors.categoryId ? 'error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Select a category...</option>
              {safeCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={values.excerpt || ''}
              onChange={handleInputChange}
              className={`form-textarea ${errors.excerpt ? 'error' : ''}`}
              placeholder="Brief description of the post..."
              rows={3}
              disabled={isLoading}
            />
            {errors.excerpt && <span className="error-message">{errors.excerpt}</span>}
            <small className="form-help">Optional short description for post previews</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={values.content || ''}
              onChange={handleInputChange}
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Write your post content here..."
              rows={12}
              disabled={isLoading}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="published"
                checked={values.published || false}
                onChange={e =>
                  handleInputChange({
                    target: { name: 'published', value: e.target.checked },
                  } as any)
                }
                disabled={isLoading}
              />
              <span className="checkbox-text">Publish immediately</span>
            </label>
            <small className="form-help">Uncheck to save as draft</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !values.title?.trim() || !values.content?.trim()}
          >
            {isLoading
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Post'
                : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
