import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DevApp } from './DevApp';
import './globals.css';

// Use DevApp for development mode with proper mock data and state management
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>
);
