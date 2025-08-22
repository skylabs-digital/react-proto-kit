import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, usersApi, categoriesApi } from '../api';
import { User, Category } from '../api';

interface PostFormProps {
  onPostChange?: () => void; // Callback to notify parent of data changes
}

export function PostForm({ onPostChange }: PostFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    published: false,
  });

  const { data: post, loading: postLoading, refetch: refetchPost } = postsApi.useById(id || '');
  const { data: users = [], refetch: refetchUsers } = usersApi.useList();
  const { data: categories = [], refetch: refetchCategories } = categoriesApi.useList();
  const { mutate: createPost, loading: createLoading } = postsApi.useCreate();
  const { mutate: updatePost, loading: updateLoading } = postsApi.useUpdate(post?.id || '');

  const loading = createLoading || updateLoading;

  const { mutate: createCategory } = categoriesApi.useCreate();

  // Create default categories if none exist
  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'General', slug: 'general', description: 'General blog posts' },
      { name: 'Technology', slug: 'technology', description: 'Technology and programming posts' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and personal posts' }
    ];

    for (const category of defaultCategories) {
      try {
        await createCategory({
          ...category,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Error creating default category:', error);
      }
    }
    refetchCategories();
  };

  useEffect(() => {
    if (categories && categories.length === 0) {
      createDefaultCategories();
    }
  }, [categories]);

  // Manual refresh function - needed because no global state sync
  const handleRefreshData = async () => {
    await Promise.all([
      refetchCategories(),
      refetchUsers(),
      isEditing ? refetchPost() : Promise.resolve(),
    ]);
  };

  // Load post data for editing
  useEffect(() => {
    if (isEditing && post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        categoryId: post.categoryId || '',
        published: post.published || false,
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
      authorId: (users || [])[0]?.id || 'default-author', // In a real app, this would be the current user
    };

    try {
      if (isEditing && post) {
        // For updates, pass the complete object with all existing fields
        const completePostData = {
          ...post,
          ...postData,
        };
        await updatePost(completePostData);
      } else {
        await createPost(postData);
      }
      // Manual callback to refresh other components
      onPostChange?.();
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
        <button
          onClick={handleRefreshData}
          className="btn btn-secondary"
          type="button"
        >
          Refresh Data
        </button>
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
            {(categories || []).map(category => (
              <option key={category.id} value={category.id}>
                {(category as any).name}
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
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Post' : 'Create Post')
            }
          </button>
        </div>
      </form>
    </div>
  );
}
