import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { ThemeProvider } from '@mui/material';

import { amplifyConfig } from 'amplifyConfig';
import App from 'app';
import { Amplify } from 'aws-amplify';
import { store } from 'store';

import './isa-brand/fonts.css';
import './isa-brand/tokens.css';

import { theme } from './styles/theme';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

Amplify.configure(amplifyConfig);

root.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <StrictMode>
        <App />
      </StrictMode>
    </ThemeProvider>
  </Provider>,
);
