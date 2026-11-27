import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { KeyObject, constants, createHash, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt } from 'node:crypto';
import { ssm } from '../../aws/clients';
import { db } from '../../db';
import { ActivatableFeatureType, ActivationDates, FeatureActivation } from '../../db/entities/activation';
import { logger } from '../../logger';
import { getUserDetails } from '../isaUser';

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

export const maxDatesAheadDays = 90;
export const maxDates = 30;
// A date ends the same day or overnight, the next day.
const maxDateSeconds = day;

export const validateDates = (requested: { from: number; until: number }[], now: Date) => {
  const nowSeconds = now.getTime() / 1000;
  if (requested.length === 0 || requested.length > maxDates) throw new Error(`Validation: pick 1 to ${maxDates} dates`);
  // Not rounded to the hour like an anonymous start: a named date keeps the member's own hours, half-hour time zones too.
  const dates = requested.map((d) => ({ from: d.from, until: d.until })).sort((a, b) => a.from - b.from);
  dates.forEach((d, i) => {
    if (!(d.until > d.from) || d.until - d.from > maxDateSeconds) {
      throw new Error('Validation: each date ends after its start and by the next day');
    }
    if (d.until <= nowSeconds) throw new Error('Validation: every date must end in the future');
    if (d.from > nowSeconds + maxDatesAheadDays * day) {
      throw new Error(`Validation: dates must be within ${maxDatesAheadDays} days`);
    }
    if (i > 0 && d.from < dates[i - 1].until) throw new Error('Validation: dates must not overlap');
  });
  return dates;
};

// A set of dates and the activations it starts share the manage link.
export const isFromDates = (activation: FeatureActivation | null, dates: ActivationDates | null) =>
  Boolean(activation && dates && activation.linkHash === dates.linkHash);

// A named set's activatedAt is never on a whole hour, so it cannot equal an anonymous activation's, which always is.
export const datesActivatedAt = (now: Date) => {
  const seconds = Math.floor(now.getTime() / 1000);
  return seconds % 3600 === 0 ? seconds + 1 : seconds;
};

// The set's next date becomes the activation once it has started, if the line or spot still exists and
// nothing else is active on it. Shared by the hourly job and the API, so a date already under way starts at once.
export const startDueDate = async (record: ActivationDates, now: number) => {
  const { featureType, featureId } = record;
  const next = record.dates.find((d) => d.until > now);
  if (!next || next.from > now) return 'notDue' as const;
  const current = await db.getActivation(featureType, featureId);
  if (current && current.until > now) return isFromDates(current, record) ? ('alreadyStarted' as const) : ('busy' as const);
  const feature = featureType === 'line' ? await db.getLineDetails(featureId) : await db.getSpotDetails(featureId);
  if (!feature) return 'featureGone' as const;
  // A date the line was busy for starts late, at the hour it actually reaches the map.
  const hour = Math.floor(now / 3600) * 3600;
  const activation = {
    featureType,
    featureId,
    from: Math.max(next.from, hour),
    until: next.until,
    activatedAt: record.activatedAt,
    linkHash: record.linkHash,
    activatedBy: record.activatedBy,
  };
  try {
    await db.putActivation(activation, now);
  } catch (error) {
    if ((error as Error).name !== 'ConditionalCheckFailedException') throw error;
    return 'busy' as const;
  }
  logger.info('activation date started', { featureType, featureId, from: activation.from, until: next.until, userId: record.activatedBy });
  return 'started' as const;
};

// Never the link hash.
export const publicActivationOf = async (featureType: ActivatableFeatureType, featureId: string) => {
  const [activation, dates] = await Promise.all([db.getActivation(featureType, featureId), db.getActivationDates(featureType, featureId)]);
  if (!activation || activation.until <= Date.now() / 1000) return undefined;
  const activatedBy = activation.activatedBy ? (await getUserDetails(activation.activatedBy))?.fullname : undefined;
  return {
    from: activation.from,
    until: activation.until,
    activatedAt: activation.activatedAt,
    activatedBy,
    fromDates: isFromDates(activation, dates),
  };
};
export type PublicActivation = Awaited<ReturnType<typeof publicActivationOf>>;

export const publicActivationDatesOf = async (featureType: ActivatableFeatureType, featureId: string) => {
  const record = await db.getActivationDates(featureType, featureId);
  const now = Date.now() / 1000;
  const dates = record?.dates.filter((d) => d.until > now) ?? [];
  if (!record || dates.length === 0) return undefined;
  const activatedBy = (await getUserDetails(record.activatedBy))?.fullname;
  return { dates, activatedAt: record.activatedAt, activatedBy };
};
export type PublicActivationDates = Awaited<ReturnType<typeof publicActivationDatesOf>>;
