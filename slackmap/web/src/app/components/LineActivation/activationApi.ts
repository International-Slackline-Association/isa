import { apiBaseUrl } from 'app/api/constants';
import { reloadMapDataAfterWrite } from 'app/api/geojson-data';
import { ensureSession } from 'app/session';
import { fetchAuthSession } from 'aws-amplify/auth';

import { Pass, returnPass, takePass, toBase64Url } from './passes';

// The activation's activatedAt is kept with the code, so a code from an earlier activation on the same line or spot is recognized as dead.
type StoredLink = { code: string; activatedAt?: number };

export type ActivationTarget = { type: 'line' | 'spot'; id: string };
// A line keeps its bare id, the key it had before spots could be activated, so stored links stay valid.
const storageKeyOf = (target: ActivationTarget) => (target.type === 'line' ? target.id : `spot:${target.id}`);
const linksKey = 'app.activationManageLinks';

const readLinks = (): Record<string, StoredLink> => {
  try {
    return JSON.parse(localStorage.getItem(linksKey) ?? '{}');
  } catch {
    return {};
  }
};
const writeLinks = (links: Record<string, StoredLink>) => {
  try {
    localStorage.setItem(linksKey, JSON.stringify(links));
  } catch {}
};
const storeLink = (target: ActivationTarget, link: StoredLink) => writeLinks({ ...readLinks(), [storageKeyOf(target)]: link });
const forgetManageCode = (target: ActivationTarget) => {
  const { [storageKeyOf(target)]: _, ...rest } = readLinks();
  writeLinks(rest);
};

export const manageCodeFor = (target: ActivationTarget, activation?: { activatedAt: number }) => {
  const link = readLinks()[storageKeyOf(target)];
  if (!link) return undefined;
  if (!activation || (link.activatedAt !== undefined && link.activatedAt !== activation.activatedAt)) {
    forgetManageCode(target);
    return undefined;
  }
  // A shared link is bound to the activation it was opened on.
  if (link.activatedAt === undefined) storeLink(target, { ...link, activatedAt: activation.activatedAt });
  return link.code;
};

// After '#', so the code never reaches a server or its logs.
export const manageLinkOf = (target: ActivationTarget, code: string) =>
  `${window.location.origin}/${target.type}/${target.id}#manage=${code}`;

export const consumeManageLinkFromUrl = (target: ActivationTarget) => {
  const code = new URLSearchParams(window.location.hash.slice(1)).get('manage');
  if (!code) return;
  storeLink(target, { code });
  history.replaceState(history.state, '', window.location.pathname + window.location.search);
};

const sha256Hex = async (text: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// Only the named activation sends the login; every other call must not carry who is signed in.
const send = async (method: string, target: ActivationTarget, body: unknown, opts: { named?: boolean }) => {
  const token = opts.named ? await fetchAuthSession().then((s) => s.tokens?.idToken?.toString()) : undefined;
  if (opts.named && !token) throw new Error('Sign in to activate with your name');
  const request = () =>
    fetch(`${apiBaseUrl}/${target.type}/${encodeURIComponent(target.id)}/activation${opts.named ? '/named' : ''}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  await ensureSession();
  let response = await request();
  if (response.status === 403 && (await response.clone().json()).code === 'SessionRequired') {
    await ensureSession(true);
    response = await request();
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

const call = (method: string, target: ActivationTarget, body: unknown, opts: { named?: boolean } = {}) => {
  const result = send(method, target, body, opts);
  reloadMapDataAfterWrite('features', result);
  return result;
};

export class NoPassError extends Error {}

// Only a pass fetched earlier: fetching one around an activation would make the two one moment.
export const activateAnonymously = async (target: ActivationTarget, until: number, from?: number) => {
  const pass: Pass | undefined = takePass();
  if (!pass) throw new NoPassError();
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  try {
    const result = (await call('POST', target, { from, until, ...pass, linkHash: await sha256Hex(code) })) as {
      from: number;
      until: number;
      activatedAt: number;
    };
    storeLink(target, { code, activatedAt: result.activatedAt });
    return result;
  } catch (error) {
    // Refused before it was spent (already active, a bad date): the pass is still good.
    if (!/pass (was |already )?used|Invalid pass/i.test((error as Error).message)) returnPass(pass);
    throw error;
  }
};

export const activateWithName = async (target: ActivationTarget, until: number, from?: number) => {
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const result = (await call('POST', target, { from, until, linkHash: await sha256Hex(code) }, { named: true })) as {
    from: number;
    until: number;
    activatedAt: number;
  };
  storeLink(target, { code, activatedAt: result.activatedAt });
  return result;
};

export const extendActivation = (target: ActivationTarget, code: string, until: number) =>
  call('PUT', target, { until, code }) as Promise<{ until: number }>;

export const deactivate = async (target: ActivationTarget, code: string) => {
  await call('DELETE', target, { code });
  forgetManageCode(target);
};
