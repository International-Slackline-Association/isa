import { useCallback, useEffect, useState } from 'react';

import type { getAllCertificates } from '@server/functions/api/endpoints/certificate-api';
import type { getUserDetails } from '@server/functions/api/endpoints/user-api';

import { idToken } from './auth';
import { showError } from './components/Toast';

const API_URL = 'https://account-api.slacklineinternational.org';

export type User = NonNullable<Awaited<ReturnType<typeof getUserDetails>>>;
export type CertificatesResponse = Awaited<ReturnType<typeof getAllCertificates>>;

async function request<T>(method: 'GET' | 'PUT' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = await idToken();
  const response = await fetch(`${API_URL}/${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  if (!response.ok || json === undefined) {
    throw new Error(json?.message || 'Unknown');
  }
  return json as T;
}

export async function put<T = unknown>(path: string, body: unknown) {
  return send<T>('PUT', path, body);
}

export async function post<T = unknown>(path: string, body: unknown) {
  return send<T>('POST', path, body);
}

async function send<T>(method: 'PUT' | 'POST', path: string, body: unknown) {
  try {
    return await request<T>(method, path, body);
  } catch (error) {
    console.error(error);
    showError(`Error: ${(error as Error).message}`);
    throw error;
  }
}

export function useFetch<T>(path: string) {
  const [state, setState] = useState<{ data?: T; isFetching: boolean }>({ isFetching: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, isFetching: true }));
    request<T>('GET', path)
      .then((data) => {
        if (!ignore) setState({ data, isFetching: false });
      })
      .catch((error: Error) => {
        console.error(error);
        showError(`Error: ${error.message}`);
        if (!ignore) setState((s) => ({ ...s, isFetching: false }));
      });
    return () => {
      ignore = true;
    };
  }, [path, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, refetch };
}
