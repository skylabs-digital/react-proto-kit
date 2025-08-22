import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          BlogPlatform
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/posts/new" className={`nav-link ${isActive('/posts/new')}`}>
            Write Post
          </Link>
          <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
            Categories
          </Link>
        </nav>
      </div>
    </header>
  );
}
