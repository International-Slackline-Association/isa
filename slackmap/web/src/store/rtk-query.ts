import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from 'app/api/constants';
import { ensureSession, showSessionFailure } from 'app/session';
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

const slackmapQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
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
});

const isSessionRequired = (error: unknown) =>
  (error as { status?: number; data?: { code?: string } })?.status === 403 &&
  (error as { data?: { code?: string } }).data?.code === 'SessionRequired';

// Every call needs the session cookie.
const sessionQuery: typeof slackmapQuery = async (args, api, extraOptions) => {
  await ensureSession();
  const result = await slackmapQuery(args, api, extraOptions);
  if (!isSessionRequired(result.error)) return result;
  await ensureSession(true);
  const retried = await slackmapQuery(args, api, extraOptions);
  if (isSessionRequired(retried.error)) showSessionFailure();
  return retried;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: sessionQuery,
  endpoints: () => ({}),
});
