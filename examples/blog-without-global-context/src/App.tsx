import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApiClientProvider } from '../../../src';
import { Header } from './components/Header';
import { BlogStats, CategoriesList, RecentActivity } from './components/Sidebar';
import { PostList } from './components/PostList';
import { PostForm } from './components/PostForm';
import { PostDetail } from './components/PostDetail';
import { CategoriesPage } from './components/CategoriesPage';

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
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        {/* NO GlobalStateProvider - each component manages its own state */}
        <div className="app">
          <Header />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts/new" element={<PostFormPage />} />
            <Route path="/posts/:id/edit" element={<PostFormPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Routes>
        </div>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;
