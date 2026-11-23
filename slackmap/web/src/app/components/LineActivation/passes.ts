import { apiBaseUrl, passes as stagePasses } from 'app/api/constants';
import { ensureSession } from 'app/session';
import { fetchAuthSession } from 'aws-amplify/auth';

export type Pass = { pass: string; signature: string };

const storageKey = 'app.activationPasses';
// Fetched once a month, the month's whole allowance in one go: a refill after every use would put a
// signed-in call right after each activation, and the two would be one moment again.
const keepStored = stagePasses.perMonth;
const fetchedMonthKey = 'app.activationPassesMonth';
const quotaKey = 'app.activationPassQuota';
export type PassQuota = { used: number; limit: number; month: string };
export const passQuota = (): PassQuota | undefined => {
  try {
    const quota = JSON.parse(localStorage.getItem(quotaKey) ?? 'null') as PassQuota | null;
    return quota?.month === thisMonth() ? quota : undefined;
  } catch {
    return undefined;
  }
};
const thisMonth = () => new Date().toISOString().slice(0, 7);
const fetchedThisMonth = () => {
  try {
    return localStorage.getItem(fetchedMonthKey) === thisMonth();
  } catch {
    return false;
  }
};

export const toBase64Url = (data: Uint8Array) =>
  btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const readPasses = (): Pass[] => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  } catch {
    return [];
  }
};
const writePasses = (passes: Pass[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(passes));
  } catch {}
};

export const takePass = () => {
  const [first, ...rest] = readPasses();
  writePasses(rest);
  return first as Pass | undefined;
};
export const returnPass = (pass: Pass) => writePasses([pass, ...readPasses()]);
export const hasPass = () => readPasses().length > 0;

const publicKey = async () => {
  const der = Uint8Array.from(atob(stagePasses.publicKey.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('spki', der, { name: 'RSA-PSS', hash: 'SHA-384' }, true, ['verify']);
};

let refilling: Promise<void> | undefined;

export const refillSettled = () => refilling ?? Promise.resolve();

export const refillPasses = () =>
  (refilling ??= (async () => {
    const missing = keepStored - readPasses().length;
    if (missing <= 0 || fetchedThisMonth()) return;
    const token = await fetchAuthSession().then((s) => s.tokens?.idToken?.toString());
    if (!token) return;

    const { RSABSSA } = await import('@cloudflare/blindrsa-ts');
    const suite = RSABSSA.SHA384.PSS.Randomized();
    const key = await publicKey();
    const blinded = await Promise.all(
      Array.from({ length: missing }, async () => {
        const pass = suite.prepare(crypto.getRandomValues(new Uint8Array(32)));
        return { pass, ...(await suite.blind(key, pass)) };
      }),
    );

    await ensureSession();
    const response = await fetch(`${apiBaseUrl}/passes`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ blindedPasses: blinded.map((b) => toBase64Url(b.blindedMsg)) }),
    });
    // A real failure (not a refusal, which is an answer) is retried on the next load.
    if (!response.ok) return;
    try {
      localStorage.setItem(fetchedMonthKey, thisMonth());
    } catch {}
    const { signatures, used, limit } = (await response.json()) as { signatures: string[]; used: number; limit: number };
    try {
      localStorage.setItem(quotaKey, JSON.stringify({ used, limit, month: thisMonth() }));
    } catch {}

    const passes = await Promise.all(
      // The server may sign fewer than asked: only what is left of the month's allowance.
      blinded.slice(0, signatures.length).map(async (b, i) => {
        const blindSignature = Uint8Array.from(atob(signatures[i].replace(/-/g, '+').replace(/_/g, '/')), (c) =>
          c.charCodeAt(0),
        );
        const signature = await suite.finalize(key, b.pass, blindSignature, b.inv);
        return { pass: toBase64Url(b.pass), signature: toBase64Url(signature) };
      }),
    );
    writePasses([...readPasses(), ...passes]);
  })()
    .catch((error) => console.warn('Getting passes failed', error))
    .finally(() => {
      refilling = undefined;
    }));
