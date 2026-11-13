import {
  Middleware,
  MiddlewareAPI,
  configureStore,
  isRejectedWithValue,
} from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import appReducer from 'app/slices/app';
import { showErrorNotification } from 'utils';

import { baseApi, isaAccountApi } from './rtk-query';

const rtkQueryErrorLogger: Middleware = (api: MiddlewareAPI) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    let e = (action?.payload as any)?.data?.message || action?.error?.message;
    if (e && e === 'Rejected') {
      e = 'Unknown';
    }
    const message = `Error: ${e}`;
    api.dispatch(showErrorNotification(message));
  }

  return next(action);
};

export const store = configureStore({
  reducer: {
    api: baseApi.reducer,
    isaAccountApi: isaAccountApi.reducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([baseApi.middleware, isaAccountApi.middleware, rtkQueryErrorLogger]),
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
