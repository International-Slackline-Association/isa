import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { KeyObject, constants, createHash, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt } from 'node:crypto';
import { ssm } from '../../aws/clients';

// RFC 9474.
const suite = RSABSSA.SHA384.PSS.Randomized();
const keyAlgorithm = { name: 'RSA-PSS', hash: 'SHA-384' };

let keys: Promise<{ privateKey: KeyObject; publicKey: CryptoKey }> | undefined;
const loadKeys = () =>
  (keys ??= (async () => {
    // Not passed as an environment variable: those are limited to 4 KB per function.
    const { Parameter } = await ssm.send(new GetParameterCommand({ Name: process.env.PASS_SIGNING_KEY_PARAMETER }));
    const privateKey = createPrivateKey(Parameter!.Value!);
    const spki = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
    return {
      privateKey,
      // The library reads the key's parameters, so it must be extractable.
      publicKey: await crypto.subtle.importKey('spki', spki, keyAlgorithm, true, ['verify']),
    };
  })().catch((error) => {
    keys = undefined;
    throw error;
  }));

export const passesPerMonth = Number(process.env.PASSES_PER_MONTH);
export const maxActivationDays = 14;

// Loaded before a member's count is raised, so a key failure never costs them passes.
export const ensurePassKeys = async () => {
  await loadKeys();
};

// RFC 9474 BlindSign with Node's native RSA: the library's pure-JS one takes about half a second per pass,
// so a month's allowance runs past the API's timeout after the member's count was already raised.
export const signBlindedPass = async (blindedPass: Uint8Array) => {
  const { privateKey } = await loadKeys();
  const raw = { key: privateKey, padding: constants.RSA_NO_PADDING };
  const signature = privateDecrypt(raw, blindedPass);
  if (!publicEncrypt(raw, signature).equals(blindedPass)) throw new Error('Pass signature failed its check');
  return new Uint8Array(signature);
};

export const isPassValid = async (pass: Uint8Array, signature: Uint8Array) => {
  const { publicKey } = await loadKeys();
  return suite.verify(publicKey, signature, pass).catch(() => false);
};

export const hashOf = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

export const currentMonth = (now: Date) => now.toISOString().slice(0, 7);

export const passCountExpiry = (now: Date) =>
  Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000);

// Public, so it is kept to the hour: an activation's exact time could be matched to other timed records.
export const activatedAtHour = (now: Date) => Math.floor(now.getTime() / 3_600_000) * 3600;

const day = 24 * 3600;

export const activationStart = (requested: number | undefined, now: Date) => {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (requested === undefined || requested <= nowSeconds) return activatedAtHour(now);
  if (requested > nowSeconds + maxActivationDays * day) {
    throw new Error(`Validation: from must be within ${maxActivationDays} days`);
  }
  return activatedAtHour(new Date(requested * 1000));
};

export const validateActivationEnd = (from: number, until: number, now: Date) => {
  const nowSeconds = now.getTime() / 1000;
  if (!(until > nowSeconds) || !(until > from)) throw new Error('Validation: until must be after the start and in the future');
  if (until > Math.max(from, nowSeconds) + maxActivationDays * day) {
    throw new Error(`Validation: an activation lasts at most ${maxActivationDays} days`);
  }
};
