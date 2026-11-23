import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';
import { ssm } from '../../aws/clients';

// RFC 9474.
const suite = RSABSSA.SHA384.PSS.Randomized();
const keyAlgorithm = { name: 'RSA-PSS', hash: 'SHA-384' };

let keys: Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> | undefined;
const loadKeys = () =>
  (keys ??= (async () => {
    // Read at start, not passed as an environment variable: those are limited to 4 KB per function.
    const { Parameter } = await ssm.send(new GetParameterCommand({ Name: process.env.PASS_SIGNING_KEY_PARAMETER }));
    const privatePem = createPrivateKey(Parameter!.Value!);
    const pkcs8 = privatePem.export({ type: 'pkcs8', format: 'der' });
    const spki = createPublicKey(privatePem).export({ type: 'spki', format: 'der' });
    return {
      // The library reads the key's parameters, so both must be extractable.
      privateKey: await crypto.subtle.importKey('pkcs8', pkcs8, keyAlgorithm, true, ['sign']),
      publicKey: await crypto.subtle.importKey('spki', spki, keyAlgorithm, true, ['verify']),
    };
  })().catch((error) => {
    keys = undefined;
    throw error;
  }));

export const passesPerMonth = 5;
export const maxActivationDays = 14;

export const signBlindedPass = async (blindedPass: Uint8Array) =>
  suite.blindSign((await loadKeys()).privateKey, blindedPass);

export const isPassValid = async (pass: Uint8Array, signature: Uint8Array) => {
  const { publicKey } = await loadKeys();
  return suite.verify(publicKey, signature, pass).catch(() => false);
};

export const hashOf = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

export const currentMonth = (now: Date) => now.toISOString().slice(0, 7);

// The count matters only during its month.
export const passCountExpiry = (now: Date) =>
  Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000);

// Public, so it is kept to the hour: an activation's exact time could be matched to other timed records.
export const activatedAtHour = (now: Date) => Math.floor(now.getTime() / 3_600_000) * 3600;

export const validateActivationUntil = (until: number, now: Date) => {
  const nowSeconds = now.getTime() / 1000;
  if (!(until > nowSeconds)) throw new Error('Validation: until must be in the future');
  if (until > nowSeconds + maxActivationDays * 24 * 3600) {
    throw new Error(`Validation: until must be within ${maxActivationDays} days`);
  }
};
