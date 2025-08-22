import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, usersApi, categoriesApi } from '../api';

export function PostForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = Boolean(slug);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    published: false,
  });

  const { data: post } = postsApi.useById!(slug || '');
  const { data: categories } = categoriesApi.useList!();
  const safeCategories = categories || [];
  const { data: users } = usersApi.useList!();
  const safeUsers = users || [];
  const { mutate: createPost, loading: creating } = postsApi.useCreate!();
  const { mutate: updatePost, loading: updating } = postsApi.useUpdate!(slug || '');

  const loading = creating || updating;

  // Load post data for editing
  useEffect(() => {
    if (isEditing && post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        categoryId: post.categoryId,
        published: post.published,
      });
    }
  }, [isEditing, post]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const generateExcerpt = (content: string) => {
    return content.substring(0, 150).replace(/\s+\S*$/, '') + '...';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }

    const postData = {
      ...formData,
      slug: generateSlug(formData.title),
      excerpt: formData.excerpt || generateExcerpt(formData.content),
      authorId: safeUsers[0]?.id || 'default-author', // In a real app, this would be the current user
    };

    try {
      if (isEditing) {
        await updatePost(postData);
      } else {
        await createPost(postData);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="content">
      <div className="card-header">
        <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter post title..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoryId" className="form-label">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            <option value="">Select a category</option>
            {safeCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="excerpt" className="form-label">
            Excerpt
          </label>
          <input
            type="text"
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Brief description (optional - will be auto-generated if empty)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Write your post content here..."
            rows={12}
            required
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleInputChange}
            />
            <span className="form-label" style={{ margin: 0 }}>
              Publish immediately
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
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
