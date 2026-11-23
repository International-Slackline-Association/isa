import { apiBaseUrl } from 'app/api/constants';
import { ensureSession } from 'app/session';

import { Pass, refillPasses, returnPass, takePass, toBase64Url } from './passes';

// Manage codes by line id, in this browser only. The server holds only their hashes.
const linksKey = 'app.rigManageLinks';

const readLinks = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(linksKey) ?? '{}');
  } catch {
    return {};
  }
};
const writeLinks = (links: Record<string, string>) => {
  try {
    localStorage.setItem(linksKey, JSON.stringify(links));
  } catch {}
};

export const manageCodeOf = (lineId: string) => readLinks()[lineId];
const storeManageCode = (lineId: string, code: string) => writeLinks({ ...readLinks(), [lineId]: code });
export const forgetManageCode = (lineId: string) => {
  const { [lineId]: _, ...rest } = readLinks();
  writeLinks(rest);
};

// After '#', so the code never reaches a server or its logs.
export const manageLinkOf = (lineId: string, code: string) =>
  `${window.location.origin}/line/${lineId}#manage=${code}`;

// A shared manage link: keep its code and take it out of the address bar.
export const consumeManageLinkFromUrl = (lineId: string) => {
  const code = new URLSearchParams(window.location.hash.slice(1)).get('manage');
  if (!code) return;
  storeManageCode(lineId, code);
  history.replaceState(history.state, '', window.location.pathname + window.location.search);
};

const sha256Hex = async (text: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// No Authorization header: these calls must not carry who is signed in.
const call = async (method: string, lineId: string, body: unknown) => {
  const send = () =>
    fetch(`${apiBaseUrl}/line/${encodeURIComponent(lineId)}/rig`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  await ensureSession();
  let response = await send();
  if (response.status === 403 && (await response.clone().json()).code === 'SessionRequired') {
    await ensureSession(true);
    response = await send();
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export class NoPassError extends Error {}

export const reportRig = async (lineId: string, until: number) => {
  let pass: Pass | undefined = takePass();
  if (!pass) {
    await refillPasses();
    pass = takePass();
  }
  if (!pass) throw new NoPassError();
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  try {
    const result = await call('POST', lineId, { until, ...pass, linkHash: await sha256Hex(code) });
    storeManageCode(lineId, code);
    refillPasses();
    return result as { until: number; reportedAt: number };
  } catch (error) {
    // Refused before it was spent (line already rigged, a bad date): the pass is still good.
    if (!/Pass already used|Invalid pass/.test((error as Error).message)) returnPass(pass);
    throw error;
  }
};

export const extendRig = (lineId: string, code: string, until: number) =>
  call('PUT', lineId, { until, code }) as Promise<{ until: number }>;

export const endRig = async (lineId: string, code: string) => {
  await call('DELETE', lineId, { code });
  forgetManageCode(lineId);
};
