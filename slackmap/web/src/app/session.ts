import { useEffect, useState } from 'react';

import { apiBaseUrl, domain, sessionRequired } from 'app/api/constants';

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
const hasSession = () => !sessionRequired || readExpiry() - renewMarginSeconds > Date.now() / 1000;

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

// A card in the middle of a dimmed screen, so the check is not missed over the map.
const overlay = (message: string) => {
  const backdrop = document.createElement('div');
  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'rgba(0,0,0,0.5)',
    fontFamily: 'var(--isa-font-family-body)',
  });
  const card = document.createElement('div');
  Object.assign(card.style, {
    background: 'white',
    color: '#222',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    textAlign: 'center',
    maxWidth: '360px',
  });
  const text = document.createElement('p');
  Object.assign(text.style, { margin: '0 0 16px', fontSize: '17px', lineHeight: '1.4' });
  text.textContent = message;
  const slot = document.createElement('div');
  card.append(text, slot);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  return { backdrop, slot };
};

const getToken = async () => {
  if (import.meta.env.DEV) return '';
  const turnstile = await loadTurnstile();
  const { backdrop, slot } = overlay('One quick check that you are human, then the map loads.');
  // Hidden while Cloudflare decides on its own; shown only when the person has to click.
  Object.assign(backdrop.style, { opacity: '0', pointerEvents: 'none' });
  try {
    return await new Promise<string>((resolve, reject) => {
      const widgetId = turnstile.render(slot, {
        sitekey: turnstileSiteKey,
        appearance: 'interaction-only',
        'before-interactive-callback': () =>
          Object.assign(backdrop.style, { opacity: '1', pointerEvents: 'auto' }),
        callback: (token: string) => {
          turnstile.remove(widgetId);
          resolve(token);
        },
        'error-callback': () => reject(new Error('turnstile')),
      });
    });
  } finally {
    backdrop.remove();
  }
};

let failureShown = false;

export const showSessionFailure = () => {
  if (failureShown) return;
  failureShown = true;
  overlay(`SlackMap couldn't start. Make sure cookies are allowed for ${domain}, then reload the page.`);
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

// Settles once the browser holds a session cookie for the data host and the API, or the check
// failed; the requests then go out anyway and the server decides. At once where no session is required.
export const ensureSession = (renew = false): Promise<void> => {
  if (!sessionRequired || (!renew && hasSession())) return Promise.resolve();
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
