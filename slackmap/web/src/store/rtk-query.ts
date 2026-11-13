import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AppState } from 'app/slices/app/types';
import { AuthState } from 'app/slices/app/types';
import { fetchAuthSession } from 'aws-amplify/auth';

export const isaAccountApi = createApi({
  reducerPath: 'isaAccountApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://account-api.slacklineinternational.org/',
    prepareHeaders: async (headers) => {
      const token = await fetchAuthSession().then((s) => s.tokens?.idToken?.toString());
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.slackmap.com',
    prepareHeaders: async (headers, { getState }) => {
      const isSignedIn = (getState() as { app: AppState }).app.authState === AuthState.SignedIn;
      if (isSignedIn) {
        const token = await fetchAuthSession()
          .then((s) => s.tokens?.idToken?.toString())
          .catch(() => null);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});
