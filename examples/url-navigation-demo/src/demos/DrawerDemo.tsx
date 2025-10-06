import React, { useState } from 'react';
import { useUrlDrawer, UrlDrawer } from '@skylabs-digital/react-proto-kit';

export default function DrawerDemo() {
  const [_isFiltersOpen, setFiltersOpen] = useUrlDrawer('filters');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('1000');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="demo-section">
      <h2>📂 Drawer Demo</h2>
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Slides in from left/right/top/bottom</li>
          <li>✅ localStorage-only (no URL pollution)</li>
          <li>✅ Cross-tab sync automatically</li>
          <li>✅ Smooth animations</li>
          <li>✅ Overlay with backdrop click to close</li>
        </ul>
      </div>

      <button className="primary" onClick={() => setFiltersOpen(true)}>
        Open Filters Drawer (localStorage)
      </button>

      <UrlDrawer param="filters" position="left" animate>
        <h3>🔍 Filters</h3>
        <div className="filter-group">
          <label>Price Range</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min"
              style={{ width: '100px' }}
            />
            <span>-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max"
              style={{ width: '100px' }}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Categories</label>
          <div className="checkbox-group">
            {['Electronics', 'Clothing', 'Books', 'Home & Garden'].map(category => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        <div className="button-group" style={{ marginTop: '20px' }}>
          <button className="primary" onClick={() => setFiltersOpen(false)}>
            Apply Filters
          </button>
          <button
            className="secondary"
            onClick={() => {
              setMinPrice('0');
              setMaxPrice('1000');
              setSelectedCategories([]);
            }}
          >
            Reset
          </button>
        </div>
      </UrlDrawer>
    </div>
  );
}
