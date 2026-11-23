import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';

// RFC 9474. The web app holds the same public key in its source, so every member is signed with one key.
const suite = RSABSSA.SHA384.PSS.Randomized();
const keyAlgorithm = { name: 'RSA-PSS', hash: 'SHA-384' };

let keys: Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> | undefined;
const loadKeys = () =>
  (keys ??= (async () => {
    const privatePem = createPrivateKey(process.env.PASS_SIGNING_KEY!);
    const pkcs8 = privatePem.export({ type: 'pkcs8', format: 'der' });
    const spki = createPublicKey(privatePem).export({ type: 'spki', format: 'der' });
    return {
      // The library reads the key's parameters, so both must be extractable.
      privateKey: await crypto.subtle.importKey('pkcs8', pkcs8, keyAlgorithm, true, ['sign']),
      publicKey: await crypto.subtle.importKey('spki', spki, keyAlgorithm, true, ['verify']),
    };
  })());

export const passesPerMonth = 5;
export const maxRigDays = 14;

export const signBlindedPass = async (blindedPass: Uint8Array) =>
  suite.blindSign((await loadKeys()).privateKey, blindedPass);

export const isPassValid = async (pass: Uint8Array, signature: Uint8Array) =>
  suite.verify((await loadKeys()).publicKey, signature, pass).catch(() => false);

export const hashOf = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

export const currentMonth = (now: Date) => now.toISOString().slice(0, 7);

// End of the month after this one: the count is not needed after its month ends.
export const passCountExpiry = (now: Date) =>
  Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1) / 1000);

// Public, so it is kept to the hour: a report's exact time could be matched to other timed records.
export const reportedAtHour = (now: Date) => Math.floor(now.getTime() / 3_600_000) * 3600;

export const validateRigUntil = (until: number, now: Date) => {
  const nowSeconds = now.getTime() / 1000;
  if (!(until > nowSeconds)) throw new Error('Validation: until must be in the future');
  if (until > nowSeconds + maxRigDays * 24 * 3600) {
    throw new Error(`Validation: until must be within ${maxRigDays} days`);
  }
};
