import React, { useState, useCallback } from 'react';
import { CategoryManager } from './CategoryManager';
import { BlogStats, CategoriesList } from './Sidebar';

export function CategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="main">
      <CategoryManager onCategoryChange={handleDataChange} />
      <aside className="sidebar">
        <BlogStats key={`stats-${refreshKey}`} />
        <CategoriesList key={`categories-${refreshKey}`} />
      </aside>
    </div>
  );
}
