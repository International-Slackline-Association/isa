import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from 'utils/redux/toolkit';

import { AppState, SnackbarNotification } from './types';

export const initialState: AppState = {
  snackbarNotification: null,
};

export const appState = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateSnackbarNotification(state, action: PayloadAction<SnackbarNotification | 'error'>) {
      let notification: SnackbarNotification;
      if (action.payload === 'error') {
        notification = {
          message: 'An error occurred',
          severity: 'error',
          duration: 3000,
        };
      } else {
        if (!action.payload) {
          notification = null;
        } else {
          notification = {
            message:
              action.payload.message ||
              (action.payload.severity === 'error' ? 'An error occurred' : ''),
            severity: action.payload.severity,
            duration: action.payload.duration,
          };
        }
      }
      state.snackbarNotification = notification;
    },
  },
});

export const { actions: appActions } = appState;
