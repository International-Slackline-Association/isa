import { z } from 'zod';
import { db } from '../../../../core/db';
import { ActivatableFeatureType, ActivationAuth, FeatureActivation } from '../../../../core/db/entities/activation';
import { addActivatedChangelog } from '../../../../core/features/mapFeature/changelog';
import {
  activatedAtHour,
  currentMonth,
  ensurePassKeys,
  hashOf,
  isPassValid,
  passCountExpiry,
  passesPerMonth,
  signBlindedPass,
  activationStart,
  maxDates,
  validateActivationEnd,
  datesActivatedAt,
  isFromDates,
  startDueDate,
  validateDates,
} from '../../../../core/features/activation';
import { logger } from '../../../../core/logger';

import { Request, Route } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';

const bytes = z.string().max(2048).transform((value, ctx) => {
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid base64url' });
  return new Uint8Array(decoded);
});
const linkHash = z.string().regex(/^[0-9a-f]{64}$/);
const passesSchema = z.object({ blindedPasses: z.array(bytes).min(1).max(passesPerMonth) });
const window = { from: z.number().int().optional(), until: z.number().int() };
const code = z.string().min(16).max(128);
const dates = z.array(z.object({ from: z.number().int(), until: z.number().int() })).max(maxDates);
const activateSchema = z.object({ ...window, pass: bytes, signature: bytes, linkHash });
const activateNamedSchema = z.object({ ...window, linkHash, remind: z.boolean() });
const extendSchema = z.object({ until: z.number().int(), code });
const deactivateSchema = z.object({ code });
const ownerChangeSchema = z.object({ until: z.number().int().optional(), remind: z.boolean().optional() });
const datesNamedSchema = z.object({ dates, linkHash, remind: z.boolean() });
const datesChangeSchema = z.object({ dates, code });
const datesOwnerChangeSchema = z.object({ dates: dates.optional(), remind: z.boolean().optional() });

// Which way the caller manages: never the hash or who, which the anonymous routes must not log.
const via = (auth: ActivationAuth) => ('linkHash' in auth ? 'link' : 'owner');

const isConditionFailed = (error: unknown) =>
  (error as Error)?.name === 'ConditionalCheckFailedException';

const nowSeconds = () => Math.floor(Date.now() / 1000);

const issuePasses = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const { blindedPasses } = validateApiPayload(req.body, passesSchema);
  const now = new Date();
  await ensurePassKeys();
  const { amount, used } = await db.takeFromPassCount(
    isaId,
    currentMonth(now),
    blindedPasses.length,
    passesPerMonth,
    passCountExpiry(now),
  );
  // None left is an answer, not an error: the browser shows the member their quota.
  const signatures = await Promise.all(blindedPasses.slice(0, amount).map(signBlindedPass));
  logger.info('passes issued', { count: signatures.length });
  return { signatures: signatures.map((s) => Buffer.from(s).toString('base64url')), used, limit: passesPerMonth };
};

const featureDetails = (featureType: ActivatableFeatureType, featureId: string) =>
  featureType === 'line' ? db.getLineDetails(featureId) : db.getSpotDetails(featureId);

const ensureCanBeActivated = async (featureType: ActivatableFeatureType, featureId: string, now: Date) => {
  const feature = await featureDetails(featureType, featureId);
  if (!feature) throw new Error(`NotFound: ${featureType} ${featureId} not found`);
  const existing = await db.getActivation(featureType, featureId);
  if (existing && existing.until > now.getTime() / 1000) {
    throw new Error(`Validation: This ${featureType} is already active`);
  }
  return feature;
};

const saveActivation = async (activation: FeatureActivation, afterSpentPass: boolean) => {
  await db.putActivation(activation, nowSeconds()).catch((error) => {
    if (!isConditionFailed(error)) throw error;
    throw new Error(
      afterSpentPass
        ? `Validation: This ${activation.featureType} was activated a moment ago; your pass was used`
        : `Validation: This ${activation.featureType} was activated a moment ago`,
    );
  });
};

// No login is read here: a valid, unspent pass is all that says a member sent it.
const activateAnonymously = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const featureId = req.params.id;
  const body = validateApiPayload(req.body, activateSchema);
  const now = new Date();
  const from = activationStart(body.from, now);
  validateActivationEnd(from, body.until, now);
  if (!(await isPassValid(body.pass, body.signature))) throw new Error('Forbidden: Invalid pass');
  const feature = await ensureCanBeActivated(featureType, featureId, now);

  await db.spendPass(hashOf(body.pass)).catch((error) => {
    if (isConditionFailed(error)) throw new Error('Forbidden: Pass already used');
    throw error;
  });
  const activation = { featureType, featureId, from, until: body.until, activatedAt: activatedAtHour(now), linkHash: body.linkHash };
  await saveActivation(activation, true);
  // Never fails the activation once it is saved: the manage link would be lost. The hourly job writes it again.
  if (from <= now.getTime() / 1000) {
    await addActivatedChangelog(feature, undefined, new Date(from * 1000)).catch(() =>
      logger.warn('history entry failed', { featureType, featureId }),
    );
  }
  logger.info('activated', { featureType, featureId, from, until: activation.until });
  return { from, until: activation.until, activatedAt: activation.activatedAt };
};

const activateWithName = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  const featureId = req.params.id;
  const body = validateApiPayload(req.body, activateNamedSchema);
  const now = new Date();
  const from = activationStart(body.from, now);
  validateActivationEnd(from, body.until, now);
  const feature = await ensureCanBeActivated(featureType, featureId, now);

  const activation = {
    featureType,
    featureId,
    from,
    until: body.until,
    activatedAt: activatedAtHour(now),
    linkHash: body.linkHash,
    activatedBy: isaId,
    remind: body.remind,
  };
  await saveActivation(activation, false);
  // Dated at the start, the same entry the hourly job writes; a later start is written by that job.
  if (from <= now.getTime() / 1000) {
    await addActivatedChangelog(feature, isaId, new Date(from * 1000)).catch(() =>
      logger.warn('history entry failed', { featureType, featureId }),
    );
  }
  logger.info('activated with name', { featureType, featureId, from, until: activation.until, userId: isaId });
  return { from, until: activation.until, activatedAt: activation.activatedAt };
};

const wrongLink = (error: unknown) => {
  if (isConditionFailed(error)) throw new Error('Forbidden: This link does not manage a current activation');
  throw error;
};

const extend = async (featureType: ActivatableFeatureType, featureId: string, auth: ActivationAuth, until: number) => {
  const current = await db.getActivation(featureType, featureId);
  if (!current) throw new Error('Forbidden: This link does not manage a current activation');
  if (until <= current.until) throw new Error('Validation: An extension must end after the current end');
  validateActivationEnd(current.from, until, new Date());
  await db.extendActivation(featureType, featureId, auth, until, nowSeconds()).catch(wrongLink);
  logger.info('activation extended', { featureType, featureId, until, via: via(auth) });
};

// An activation that came from a set of dates stands for its date: ending it skips that date, or the hourly
// job would start it again. The date goes first, so the job never sees the activation gone and the date left.
const end = async (featureType: ActivatableFeatureType, featureId: string, auth: ActivationAuth) => {
  const [current, dates] = await Promise.all([db.getActivation(featureType, featureId), db.getActivationDates(featureType, featureId)]);
  const now = nowSeconds();
  const fromDates = isFromDates(current, dates);
  if (fromDates && current && dates) {
    const upcoming = dates.dates.filter((d) => d.until > now);
    const rest = upcoming.filter((d) => !(d.from < current.until && d.until > current.from));
    if (rest.length < upcoming.length) {
      if (rest.length) await db.updateActivationDates(featureType, featureId, auth, { dates: rest }, now).catch(wrongLink);
      else await db.endActivationDates(featureType, featureId, auth, now).catch(wrongLink);
      logger.info('activation date skipped', { featureType, featureId, datesLeft: rest.length, via: via(auth) });
    }
  }
  await db.endActivation(featureType, featureId, auth, now).catch(wrongLink);
  logger.info('deactivated', { featureType, featureId, via: via(auth), fromDates });
};

const extendActivation = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const body = validateApiPayload(req.body, extendSchema);
  await extend(featureType, req.params.id, { linkHash: hashOf(body.code) }, body.until);
  return { until: body.until };
};

const deactivate = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const body = validateApiPayload(req.body, deactivateSchema);
  await end(featureType, req.params.id, { linkHash: hashOf(body.code) });
  return {};
};

const changeAsOwner = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  const featureId = req.params.id;
  const body = validateApiPayload(req.body, ownerChangeSchema);
  if (body.until !== undefined) await extend(featureType, featureId, { activatedBy: isaId }, body.until);
  if (body.remind !== undefined) {
    await db.setActivationRemind(featureType, featureId, isaId, body.remind, nowSeconds()).catch(wrongLink);
    logger.info('activation reminder set', { featureType, featureId, remind: body.remind, userId: isaId });
  }
  return {};
};

const deactivateAsOwner = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  await end(featureType, req.params.id, { activatedBy: isaId });
  return {};
};

const wrongDates = (error: unknown) => {
  if (isConditionFailed(error)) throw new Error('Forbidden: This does not manage current dates');
  throw error;
};

const activateDatesWithName = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  const featureId = req.params.id;
  const body = validateApiPayload(req.body, datesNamedSchema);
  const now = new Date();
  const checked = validateDates(body.dates, now);
  const feature = await featureDetails(featureType, featureId);
  if (!feature) throw new Error(`NotFound: ${featureType} ${featureId} not found`);
  const record = {
    featureType,
    featureId,
    dates: checked,
    activatedAt: datesActivatedAt(now),
    linkHash: body.linkHash,
    activatedBy: isaId,
    remind: body.remind,
  };
  await db.putActivationDates(record, nowSeconds()).catch((error) => {
    if (isConditionFailed(error)) throw new Error(`Validation: This ${featureType} already has dates`);
    throw error;
  });
  const started = await startDueDate(record, nowSeconds()).catch((error) => {
    // The set is saved; the hourly job starts the date.
    logger.error('activation date start failed', { featureType, featureId, message: (error as Error).message });
    return 'failed';
  });
  logger.info('activation dates set', {
    started,
    featureType,
    featureId,
    count: checked.length,
    firstFrom: checked[0].from,
    lastUntil: checked[checked.length - 1].until,
    remind: body.remind,
    userId: isaId,
  });
  return { dates: checked, activatedAt: record.activatedAt };
};

const changeDates = async (
  featureType: ActivatableFeatureType,
  featureId: string,
  auth: ActivationAuth,
  change: { dates?: { from: number; until: number }[]; remind?: boolean },
) => {
  const checked = change.dates ? validateDates(change.dates, new Date()) : undefined;
  if (!checked && change.remind === undefined) return {};
  await db.updateActivationDates(featureType, featureId, auth, { dates: checked, remind: change.remind }, nowSeconds()).catch(wrongDates);
  const record = checked ? await db.getActivationDates(featureType, featureId) : null;
  const started = record
    ? await startDueDate(record, nowSeconds()).catch((error) => {
        logger.error('activation date start failed', { featureType, featureId, message: (error as Error).message });
        return 'failed';
      })
    : undefined;
  logger.info('activation dates changed', {
    started,
    featureType,
    featureId,
    count: checked?.length,
    lastUntil: checked?.[checked.length - 1].until,
    remind: change.remind,
    via: via(auth),
  });
  return { dates: checked };
};

const changeDatesWithLink = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const body = validateApiPayload(req.body, datesChangeSchema);
  return changeDates(featureType, req.params.id, { linkHash: hashOf(body.code) }, { dates: body.dates });
};

const changeDatesAsOwner = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  const body = validateApiPayload(req.body, datesOwnerChangeSchema);
  return changeDates(featureType, req.params.id, { activatedBy: isaId }, body);
};

const stopDates = async (featureType: ActivatableFeatureType, featureId: string, auth: ActivationAuth) => {
  await db.endActivationDates(featureType, featureId, auth, nowSeconds()).catch(wrongDates);
  logger.info('activation dates stopped', { featureType, featureId, via: via(auth) });
  return {};
};

const stopDatesWithLink = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const body = validateApiPayload(req.body, deactivateSchema);
  return stopDates(featureType, req.params.id, { linkHash: hashOf(body.code) });
};

const stopDatesAsOwner = (featureType: ActivatableFeatureType) => async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  return stopDates(featureType, req.params.id, { activatedBy: isaId });
};

const myActivations = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const now = nowSeconds();
  const types: ActivatableFeatureType[] = ['line', 'spot'];
  const [activations, datesRecords] = await Promise.all([
    Promise.all(types.map((t) => db.getAllActivations(t))).then((all) => all.flat()),
    Promise.all(types.map((t) => db.getAllActivationDates(t))).then((all) => all.flat()),
  ]);
  const setLinks = new Set(datesRecords.map((d) => d.linkHash));
  const mine = [
    ...activations
      .filter((a) => a.activatedBy === isaId && a.until > now && !setLinks.has(a.linkHash))
      .map((a) => ({ featureType: a.featureType, featureId: a.featureId, kind: 'once' as const, from: a.from, until: a.until, remind: Boolean(a.remind) })),
    ...datesRecords
      .map((d) => ({ ...d, dates: d.dates.filter((x) => x.until > now) }))
      .filter((d) => d.activatedBy === isaId && d.dates.length > 0)
      .map((d) => ({ featureType: d.featureType, featureId: d.featureId, kind: 'dates' as const, from: d.dates[0].from, until: d.dates[d.dates.length - 1].until, remind: d.remind })),
  ];
  const withNames = await Promise.all(
    mine.map(async (m) => ({ ...m, name: (await featureDetails(m.featureType, m.featureId))?.name || null })),
  );
  logger.info('own activations listed', { count: withNames.length });
  return { activations: withNames.sort((a, b) => a.from - b.from) };
};

export const signedInActivationRoutes: Record<string, Route> = {
  'POST /passes': jsonRoute(issuePasses),
  'GET /me/activations': jsonRoute(myActivations),
  'POST /line/:id/activation/named': jsonRoute(activateWithName('line')),
  'PUT /line/:id/activation/named': jsonRoute(changeAsOwner('line')),
  'DELETE /line/:id/activation/named': jsonRoute(deactivateAsOwner('line')),
  'POST /line/:id/activation/named/dates': jsonRoute(activateDatesWithName('line')),
  'PUT /line/:id/activation/named/dates': jsonRoute(changeDatesAsOwner('line')),
  'DELETE /line/:id/activation/named/dates': jsonRoute(stopDatesAsOwner('line')),
  'POST /spot/:id/activation/named': jsonRoute(activateWithName('spot')),
  'PUT /spot/:id/activation/named': jsonRoute(changeAsOwner('spot')),
  'DELETE /spot/:id/activation/named': jsonRoute(deactivateAsOwner('spot')),
  'POST /spot/:id/activation/named/dates': jsonRoute(activateDatesWithName('spot')),
  'PUT /spot/:id/activation/named/dates': jsonRoute(changeDatesAsOwner('spot')),
  'DELETE /spot/:id/activation/named/dates': jsonRoute(stopDatesAsOwner('spot')),
};

export const activationRoutes: Record<string, Route> = {
  'POST /line/:id/activation': jsonRoute(activateAnonymously('line')),
  'PUT /line/:id/activation': jsonRoute(extendActivation('line')),
  'DELETE /line/:id/activation': jsonRoute(deactivate('line')),
  'PUT /line/:id/activation/dates': jsonRoute(changeDatesWithLink('line')),
  'DELETE /line/:id/activation/dates': jsonRoute(stopDatesWithLink('line')),
  'POST /spot/:id/activation': jsonRoute(activateAnonymously('spot')),
  'PUT /spot/:id/activation': jsonRoute(extendActivation('spot')),
  'DELETE /spot/:id/activation': jsonRoute(deactivate('spot')),
  'PUT /spot/:id/activation/dates': jsonRoute(changeDatesWithLink('spot')),
  'DELETE /spot/:id/activation/dates': jsonRoute(stopDatesWithLink('spot')),
};
