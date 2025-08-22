import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { configureDebugLogging } from '../../../src/utils/debug';

// Enable debug logging
configureDebugLogging(true, '[BLOG-WITHOUT-CONTEXT]');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
