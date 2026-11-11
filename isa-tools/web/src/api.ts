import { useEffect, useState } from 'react';

import { showError } from './components/Toast';

const API_URL = 'https://tools-api.slacklineinternational.org';

/** GET `path` from the tools API. A null path does not fetch. Failures show the error toast. */
export function useFetch<T>(path: string | null) {
  const [state, setState] = useState<{ data?: T; isFetching: boolean }>({
    isFetching: path !== null,
  });

  useEffect(() => {
    if (path === null) return;
    let ignore = false;
    setState({ isFetching: true });
    fetch(`${API_URL}/${path}`)
      .then(async (response) => {
        const text = await response.text();
        let body: any;
        try {
          body = JSON.parse(text);
        } catch {
          body = undefined;
        }
        if (!response.ok || body === undefined) {
          throw new Error(body?.message || 'Rejected');
        }
        return body as T;
      })
      .then((data) => {
        if (!ignore) setState({ data, isFetching: false });
      })
      .catch((error: Error) => {
        showError(`Error: ${error.message}`);
        if (!ignore) setState({ isFetching: false });
      });
    return () => {
      ignore = true;
    };
  }, [path]);

  return state;
}

export function useList<T>(path: string) {
  const { data, isFetching } = useFetch<{ items: T[] }>(path);
  return { data: data?.items, isFetching };
}
