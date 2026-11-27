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

// A set of dates and the activations it starts share one activatedAt, so either keeps the link alive.
export const manageLinkFor = (target: ActivationTarget, ...current: ({ activatedAt: number } | undefined)[]) => {
  const link = readLinks()[storageKeyOf(target)];
  if (!link) return undefined;
  const alive = current.filter((c): c is { activatedAt: number } => Boolean(c));
  if (alive.length === 0 || (link.activatedAt !== undefined && !alive.some((c) => c.activatedAt === link.activatedAt))) {
    forgetManageCode(target);
    return undefined;
  }
  // A link shared before it carried its activatedAt is bound to the activation it was opened on.
  if (link.activatedAt === undefined) {
    storeLink(target, { ...link, activatedAt: alive[0].activatedAt });
    return { code: link.code, activatedAt: alive[0].activatedAt };
  }
  return { code: link.code, activatedAt: link.activatedAt };
};

// After '#', so the code never reaches a server or its logs.
// The activatedAt it manages travels with it: a line can hold someone else's activation and a set of dates at once.
export const manageLinkOf = (target: ActivationTarget, link: { code: string; activatedAt: number }) =>
  `${window.location.origin}/${target.type}/${target.id}#manage=${link.code}&at=${link.activatedAt}`;

export const consumeManageLinkFromUrl = (target: ActivationTarget) => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get('manage');
  if (!code) return;
  const at = Number(params.get('at'));
  storeLink(target, { code, activatedAt: Number.isInteger(at) && at > 0 ? at : undefined });
  history.replaceState(history.state, '', window.location.pathname + window.location.search);
};

const sha256Hex = async (text: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

type Opts = { named?: boolean; dates?: boolean };

// Only the named routes send the login; every other call must not carry who is signed in.
const send = async (method: string, target: ActivationTarget, body: unknown, opts: Opts) => {
  const token = opts.named ? await fetchAuthSession().then((s) => s.tokens?.idToken?.toString()) : undefined;
  if (opts.named && !token) throw new Error('Sign in to activate with your name');
  const path = `${opts.named ? '/named' : ''}${opts.dates ? '/dates' : ''}`;
  const request = () =>
    fetch(`${apiBaseUrl}/${target.type}/${encodeURIComponent(target.id)}/activation${path}`, {
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

const call = (method: string, target: ActivationTarget, body: unknown, opts: Opts = {}) => {
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

export const activateWithName = async (target: ActivationTarget, until: number, from: number | undefined, remind: boolean) => {
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const result = (await call('POST', target, { from, until, remind, linkHash: await sha256Hex(code) }, { named: true })) as {
    from: number;
    until: number;
    activatedAt: number;
  };
  storeLink(target, { code, activatedAt: result.activatedAt });
  return result;
};

export type ActivationDate = { from: number; until: number };

export const activateDatesWithName = async (target: ActivationTarget, dates: ActivationDate[], remind: boolean) => {
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const result = (await call('POST', target, { dates, remind, linkHash: await sha256Hex(code) }, { named: true, dates: true })) as {
    dates: ActivationDate[];
    activatedAt: number;
  };
  storeLink(target, { code, activatedAt: result.activatedAt });
  return result;
};

export type ManageAuth = { code: string } | 'owner';

export const extendActivation = (target: ActivationTarget, auth: ManageAuth, until: number) =>
  auth === 'owner' ? call('PUT', target, { until }, { named: true }) : call('PUT', target, { until, code: auth.code });

export const deactivate = (target: ActivationTarget, auth: ManageAuth) =>
  auth === 'owner' ? call('DELETE', target, {}, { named: true }) : call('DELETE', target, { code: auth.code });

export const changeDates = (target: ActivationTarget, auth: ManageAuth, dates: ActivationDate[]) =>
  auth === 'owner'
    ? call('PUT', target, { dates }, { named: true, dates: true })
    : call('PUT', target, { dates, code: auth.code }, { dates: true });

export const stopDates = async (target: ActivationTarget, auth: ManageAuth) => {
  await (auth === 'owner' ? call('DELETE', target, {}, { named: true, dates: true }) : call('DELETE', target, { code: auth.code }, { dates: true }));
};

export const setRemind = (target: ActivationTarget, kind: 'once' | 'dates', remind: boolean) =>
  call('PUT', target, { remind }, { named: true, dates: kind === 'dates' });
