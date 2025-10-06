import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  UrlModalsContainer,
  SnackbarProvider,
  SnackbarContainer,
} from '@skylabs-digital/react-proto-kit';
import DemoPage from './DemoPage';

export default function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <UrlModalsContainer />
        <SnackbarContainer position="top-right" maxVisible={3} />
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SnackbarProvider>
    </BrowserRouter>
  );
}
