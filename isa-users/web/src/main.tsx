import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { configureAuth } from './auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import './isa-brand/fonts.css';
import './isa-brand/tokens.css';
import './styles.css';

configureAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
