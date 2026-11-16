import { useEffect, useState } from 'react';

import { apiBaseUrl } from 'app/api/constants';

// Public.
const turnstileSiteKey = '0x4AAAAAAGDecDHSrTlBoDNO';
const sessionUrl = `${apiBaseUrl}/session`;
const expiryStorageKey = 'slackmapSessionExpiresAt';
// Renew a little before the cookie runs out, so a request never races its expiry.
const renewMarginSeconds = 30 * 60;

type Turnstile = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// Kept in memory too, so a browser without storage still checks once per page load.
let knownExpiry = 0;
const readExpiry = () => {
  try {
    return Math.max(knownExpiry, Number(localStorage.getItem(expiryStorageKey)) || 0);
  } catch {
    return knownExpiry;
  }
};
const writeExpiry = (expiresAt: number) => {
  knownExpiry = expiresAt;
  try {
    localStorage.setItem(expiryStorageKey, String(expiresAt));
  } catch {}
};
const hasSession = () => readExpiry() - renewMarginSeconds > Date.now() / 1000;

const loadTurnstile = () =>
  new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    script.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(script);
  });

const container = () => {
  const element = document.createElement('div');
  Object.assign(element.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2000',
    fontFamily: 'Lato, sans-serif',
  });
  document.body.appendChild(element);
  return element;
};

const getToken = async () => {
  if (import.meta.env.DEV) return '';
  const turnstile = await loadTurnstile();
  const element = container();
  try {
    return await new Promise<string>((resolve, reject) => {
      const widgetId = turnstile.render(element, {
        sitekey: turnstileSiteKey,
        // The widget stays invisible unless Cloudflare needs the person to click.
        appearance: 'interaction-only',
        callback: (token: string) => {
          turnstile.remove(widgetId);
          resolve(token);
        },
        'error-callback': () => reject(new Error('turnstile')),
      });
    });
  } finally {
    element.remove();
  }
};

let failureShown = false;

export const showSessionFailure = () => {
  if (failureShown) return;
  failureShown = true;
  const element = container();
  Object.assign(element.style, {
    background: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  });
  element.textContent = "We couldn't verify your browser. Reload the page to try again.";
};

const startSession = async () => {
  const token = await getToken();
  const response = await fetch(sessionUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(`session ${response.status}`);
  const { expiresAt } = (await response.json()) as { expiresAt: number };
  writeExpiry(expiresAt);
};

let pending: Promise<void> | undefined;

// Settles once the browser holds a session cookie for data.slackmap.com and the API, or the check
// failed; the requests then go out anyway and the server decides.
export const ensureSession = (renew = false): Promise<void> => {
  if (!renew && hasSession()) return Promise.resolve();
  pending ??= startSession()
    .catch((error) => console.warn('Session not started', error))
    .finally(() => {
      pending = undefined;
    });
  return pending;
};

export const useSessionReady = () => {
  const [ready, setReady] = useState(hasSession);
  useEffect(() => {
    if (!ready) ensureSession().then(() => setReady(true));
  }, [ready]);
  return ready;
};
