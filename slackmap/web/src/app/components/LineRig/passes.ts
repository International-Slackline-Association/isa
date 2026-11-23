import { apiBaseUrl } from 'app/api/constants';
import { ensureSession } from 'app/session';
import { fetchAuthSession } from 'aws-amplify/auth';

// The public half of the pass signing key (SSM slackmap-pass-signing-key). It sits in the public source so
// anyone can check every member is signed with the same key, which is what keeps passes anonymous.
const passPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtMDAxJxAFbyYGY3vkLnR
PAu3UrpPm6AP80I+H9AbuAoS01NAr+9QVDil92ax0jgucZiH4FirnCW6dYcdScEB
j2cTKrvztEWbwPDSoFv6/7YvBfbuVQfiltdYh0irGG0uu1DTzc3U1yKboRAhpa8c
6jmGSbxrPZBzjRJNoIzzSkvBO4qNDwi1R6g23mFcjdDHtLca4tWtXKJM3NCXPF4m
N/kWoF+TCFmHupIoka9E61SNbk3FNitVsmFDTEAXi2BUdNvyphCh6REyr/PYOsQh
3xpcTXSufZqRV9VrL1qmHZzQ23EHL9vQEzHMsZah/v4cUpkTU7ql5tU1nuzVqIts
CQIDAQAB
-----END PUBLIC KEY-----`;

export type Pass = { pass: string; signature: string };

const storageKey = 'app.rigPasses';
// Fetched once a month, the month's whole allowance in one go: a refill after every use would put a
// signed-in call right after each activation, and the two would be one moment again.
const keepStored = 5;
const fetchedMonthKey = 'app.rigPassesMonth';
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

const publicKey = async () => {
  const der = Uint8Array.from(atob(passPublicKey.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('spki', der, { name: 'RSA-PSS', hash: 'SHA-384' }, true, ['verify']);
};

let refilling: Promise<void> | undefined;

// Signed in only: the server learns that this member took passes, never which ones.
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
    // Marked even when refused (the month's allowance used on another device), so it is not retried on every load.
    try {
      localStorage.setItem(fetchedMonthKey, thisMonth());
    } catch {}
    if (!response.ok) return;
    const { signatures } = (await response.json()) as { signatures: string[] };

    const passes = await Promise.all(
      blinded.map(async (b, i) => {
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
