import React, { useState } from 'react';
import { categoriesApi } from '../api';
import { CategoryItem } from './CategoryItem';

interface CategoryManagerProps {
  onCategoryChange?: () => void;
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const { data: categories } = categoriesApi.useList();
  const { mutate: createCategory, loading: creating } = categoriesApi.useCreate();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      await createCategory({
        ...formData,
        slug: generateSlug(formData.name),
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setFormData({ name: '', description: '' });
      setShowForm(false);
      // With backend and global state, data will sync automatically
      onCategoryChange?.();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category. Please try again.');
    }
  };

  const handleDeleteCategory = () => {
    // With backend and global state, data will sync automatically
    // No need to manually refetch
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createDefaultCategories = async () => {
    const defaultCategories = [
      {
        name: 'General',
        slug: 'general',
        description: 'General blog posts and announcements',
      },
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Technology and programming related posts',
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Lifestyle and personal posts',
      },
      {
        name: 'Tutorial',
        slug: 'tutorial',
        description: 'How-to guides and tutorials',
      },
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
    // With backend and global state, data will sync automatically
    onCategoryChange?.();
  };

  const safeCategories = categories || [];

  return (
    <div className="category-manager">
      <div className="category-header">
        <h2>Category Management</h2>
        <div className="category-actions">
          {safeCategories.length === 0 && (
            <button
              onClick={createDefaultCategories}
              className="btn btn-secondary"
              disabled={creating}
            >
              Create Default Categories
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Add Category'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter category name..."
              disabled={creating}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Optional description..."
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !formData.name.trim()}
            >
              {creating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      <div className="categories-list">
        {safeCategories.length === 0 ? (
          <div className="empty-state">
            <h3>No Categories Yet</h3>
            <p>Create some categories to organize your blog posts.</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
              With Backend + Global Context, category changes sync automatically across all
              components and persist to the server.
            </p>
          </div>
        ) : (
          <div className="categories-grid">
            {safeCategories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                onDelete={() => handleDeleteCategory()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
