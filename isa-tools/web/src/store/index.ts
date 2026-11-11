import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { baseApi, rtkQueryErrorLogger } from './rtk-query';
import { appState } from './state';
import { StaticReducersType } from './types';

const staticReducers: StaticReducersType = {
  api: baseApi.reducer,
  app: appState.reducer,
};

export function configureAppStore() {
  const middlewares = [baseApi.middleware, rtkQueryErrorLogger];

  const store = configureStore({
    reducer: createReducer(staticReducers),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middlewares),
    devTools: process.env.NODE_ENV !== 'production',
  });
  setupListeners(store.dispatch);
  return store;
}

const createReducer = (staticReducers: StaticReducersType) => {
  if (Object.keys(staticReducers).length === 0) {
    return (state) => state;
  } else {
    return combineReducers({
      ...staticReducers,
    });
  }
};
