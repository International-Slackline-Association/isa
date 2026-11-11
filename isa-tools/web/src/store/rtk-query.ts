import { Middleware, MiddlewareAPI, isRejectedWithValue } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { showErrorNotification } from 'utils';

export const API_BASE_URL = '';

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://tools-api.slacklineinternational.org',
});

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  endpoints: () => ({}),
});

export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next: any) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const message = `Error: ${action?.payload?.data?.message || action?.error?.message}`;
      api.dispatch(showErrorNotification(message));
    }

    return next(action);
  };
