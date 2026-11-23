import { apiBaseUrl } from 'app/api/constants';
import { ensureSession } from 'app/session';

import { Pass, returnPass, takePass, toBase64Url } from './passes';

// The rig's reportedAt is kept with the code, so a code from an earlier rig on the same line is recognized as dead.
type StoredLink = { code: string; reportedAt?: number };
const linksKey = 'app.rigManageLinks';

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
const storeLink = (lineId: string, link: StoredLink) => writeLinks({ ...readLinks(), [lineId]: link });
const forgetManageCode = (lineId: string) => {
  const { [lineId]: _, ...rest } = readLinks();
  writeLinks(rest);
};

export const manageCodeFor = (lineId: string, rig?: { reportedAt: number }) => {
  const link = readLinks()[lineId];
  if (!link) return undefined;
  if (!rig || (link.reportedAt !== undefined && link.reportedAt !== rig.reportedAt)) {
    forgetManageCode(lineId);
    return undefined;
  }
  // A shared link is bound to the rig it was opened on.
  if (link.reportedAt === undefined) storeLink(lineId, { ...link, reportedAt: rig.reportedAt });
  return link.code;
};

// After '#', so the code never reaches a server or its logs.
export const manageLinkOf = (lineId: string, code: string) =>
  `${window.location.origin}/line/${lineId}#manage=${code}`;

export const consumeManageLinkFromUrl = (lineId: string) => {
  const code = new URLSearchParams(window.location.hash.slice(1)).get('manage');
  if (!code) return;
  storeLink(lineId, { code });
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

// Only a pass fetched earlier: fetching one around a report would make the two one moment.
export const reportRig = async (lineId: string, until: number) => {
  const pass: Pass | undefined = takePass();
  if (!pass) throw new NoPassError();
  const code = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  try {
    const result = (await call('POST', lineId, { until, ...pass, linkHash: await sha256Hex(code) })) as {
      until: number;
      reportedAt: number;
    };
    storeLink(lineId, { code, reportedAt: result.reportedAt });
    return result;
  } catch (error) {
    // Refused before it was spent (line already rigged, a bad date): the pass is still good.
    if (!/pass (already )?used|Invalid pass/i.test((error as Error).message)) returnPass(pass);
    throw error;
  }
};

export const extendRig = (lineId: string, code: string, until: number) =>
  call('PUT', lineId, { until, code }) as Promise<{ until: number }>;

export const endRig = async (lineId: string, code: string) => {
  await call('DELETE', lineId, { code });
  forgetManageCode(lineId);
};
