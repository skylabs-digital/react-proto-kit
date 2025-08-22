import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ApiClientProvider } from '../../../src';
import { Header } from './components/Header';
import { BlogStats, CategoriesList, RecentActivity } from './components/Sidebar';
import { PostList } from './components/PostList';
import { PostForm } from './components/PostForm';
import { PostDetail } from './components/PostDetail';

function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual refresh callback - needed to coordinate between components
  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="main">
      <div className="content">
        <PostList onDataChange={handleDataChange} />
      </div>
      <aside className="sidebar">
        <BlogStats key={`stats-${refreshKey}`} onDataChange={handleDataChange} />
        <CategoriesList key={`categories-${refreshKey}`} onDataChange={handleDataChange} />
        <RecentActivity key={`activity-${refreshKey}`} onDataChange={handleDataChange} />
      </aside>
    </div>
  );
}

function PostFormPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="main">
      <PostForm onPostChange={handleDataChange} />
      <aside className="sidebar">
        <BlogStats key={`stats-${refreshKey}`} onDataChange={handleDataChange} />
      </aside>
    </div>
  );
}

function PostDetailPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="main">
      <PostDetail onDataChange={handleDataChange} />
      <aside className="sidebar">
        <BlogStats key={`stats-${refreshKey}`} onDataChange={handleDataChange} />
        <CategoriesList key={`categories-${refreshKey}`} onDataChange={handleDataChange} />
      </aside>
    </div>
  );
}

function App() {
  return (
    <ApiClientProvider connectorType="localStorage">
      {/* NO GlobalStateProvider - each component manages its own state */}
      <div className="app">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/new" element={<PostFormPage />} />
          <Route path="/posts/:slug/edit" element={<PostFormPage />} />
          <Route path="/posts/:slug" element={<PostDetailPage />} />
          <Route
            path="/categories"
            element={
              <div className="main">
                <div className="content">
                  <h2>Categories</h2>
                  <p>Category management coming soon...</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                    Note: Without Global Context, this page would need manual refresh buttons and
                    callback chains to stay synchronized with other components.
                  </p>
                </div>
                <aside className="sidebar">
                  <BlogStats />
                  <CategoriesList />
                </aside>
              </div>
            }
          />
        </Routes>
      </div>
    </ApiClientProvider>
  );
}

export default App;
