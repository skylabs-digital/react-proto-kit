import React from 'react';
import { categoriesApi } from '../api';
import { Category } from '../api';

interface CategoryItemProps {
  category: Category & { id: string };
  onDelete?: () => void;
}

export function CategoryItem({ category, onDelete }: CategoryItemProps) {
  const { mutate: deleteCategory } = categoriesApi.useDelete();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(undefined, category.id);
        onDelete?.();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  return (
    <div
      className="category-item"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        marginBottom: '0.5rem',
      }}
    >
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>
          {category.name}
        </h4>
        {category.description && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            {category.description}
          </p>
        )}
      </div>
      <button onClick={handleDelete} className="btn btn-small btn-danger" style={{ flexShrink: 0 }}>
        Delete
      </button>
    </div>
  );
}
