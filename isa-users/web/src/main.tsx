import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { configureAuth } from './auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import './styles.css';

configureAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
