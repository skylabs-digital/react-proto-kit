import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApiClientProvider, GlobalStateProvider } from '../../../src';
import { Header } from './components/Header';
import { BlogStats, CategoriesList, RecentActivity } from './components/Sidebar';
import { PostList } from './components/PostList';
import { PostForm } from './components/PostForm';
import { PostDetail } from './components/PostDetail';

function HomePage() {
  return (
    <div className="main">
      <div className="content">
        <PostList />
      </div>
      <aside className="sidebar">
        <BlogStats />
        <CategoriesList />
        <RecentActivity />
      </aside>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <GlobalStateProvider>
          <div className="app">
            <Header />

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/posts/new"
                element={
                  <div className="main">
                    <PostForm />
                    <aside className="sidebar">
                      <BlogStats />
                    </aside>
                  </div>
                }
              />
              <Route
                path="/posts/:slug/edit"
                element={
                  <div className="main">
                    <PostForm />
                    <aside className="sidebar">
                      <BlogStats />
                    </aside>
                  </div>
                }
              />
              <Route
                path="/posts/:slug"
                element={
                  <div className="main">
                    <PostDetail />
                    <aside className="sidebar">
                      <BlogStats />
                      <CategoriesList />
                    </aside>
                  </div>
                }
              />
              <Route
                path="/categories"
                element={
                  <div className="main">
                    <div className="content">
                      <h2>Categories</h2>
                      <p>Category management coming soon...</p>
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
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;
