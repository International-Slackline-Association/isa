import { z } from 'zod';
import { db } from '../../../../core/db';
import { LineActivation } from '../../../../core/db/entities/line/activation';
import {
  activatedAtHour,
  currentMonth,
  hashOf,
  isPassValid,
  passCountExpiry,
  passesPerMonth,
  signBlindedPass,
  validateActivationUntil,
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
const activateSchema = z.object({ until: z.number().int(), pass: bytes, signature: bytes, linkHash });
const activateNamedSchema = z.object({ until: z.number().int(), linkHash });
const extendSchema = z.object({ until: z.number().int(), code: z.string().min(16).max(128) });
const deactivateSchema = z.object({ code: z.string().min(16).max(128) });

const isConditionFailed = (error: unknown) =>
  (error as Error)?.name === 'ConditionalCheckFailedException';

const nowSeconds = () => Math.floor(Date.now() / 1000);

// Signed in: the member is known here, and only how many passes they took this month is stored.
const issuePasses = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const { blindedPasses } = validateApiPayload(req.body, passesSchema);
  const now = new Date();
  await db
    .addToPassCount(isaId, currentMonth(now), blindedPasses.length, passesPerMonth, passCountExpiry(now))
    .catch((error) => {
      if (isConditionFailed(error)) throw new Error('TooManyRequests: No passes left this month');
      throw error;
    });
  const signatures = await Promise.all(blindedPasses.map(signBlindedPass));
  logger.info('passes issued', { count: signatures.length });
  return { signatures: signatures.map((s) => Buffer.from(s).toString('base64url')) };
};

const ensureLineCanBeActivated = async (lineId: string, now: Date) => {
  if (!(await db.getLineDetails(lineId))) throw new Error(`NotFound: Line ${lineId} not found`);
  const existing = await db.getLineActivation(lineId);
  if (existing && existing.until > now.getTime() / 1000) {
    throw new Error('Validation: This line is already active');
  }
};

const saveActivation = async (activation: LineActivation, afterSpentPass: boolean) => {
  await db.putLineActivation(activation, nowSeconds()).catch((error) => {
    if (!isConditionFailed(error)) throw error;
    throw new Error(
      afterSpentPass
        ? 'Validation: This line was activated a moment ago; your pass was used'
        : 'Validation: This line was activated a moment ago',
    );
  });
};

// No login is read here: a valid, unspent pass is all that says a member sent it.
const activateAnonymously = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, activateSchema);
  const now = new Date();
  validateActivationUntil(body.until, now);
  if (!(await isPassValid(body.pass, body.signature))) throw new Error('Forbidden: Invalid pass');
  await ensureLineCanBeActivated(lineId, now);

  await db.spendPass(hashOf(body.pass)).catch((error) => {
    if (isConditionFailed(error)) throw new Error('Forbidden: Pass already used');
    throw error;
  });
  const activation = { lineId, until: body.until, activatedAt: activatedAtHour(now), linkHash: body.linkHash };
  await saveActivation(activation, true);
  logger.info('line activated', { lineId, until: activation.until });
  return { until: activation.until, activatedAt: activation.activatedAt };
};

// With the member's name: signed in, no pass. Managed by the same manage link as an anonymous one.
const activateWithName = async (req: Request<{ id: string }>) => {
  const { isaId } = verifyRequestClaims(req);
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, activateNamedSchema);
  const now = new Date();
  validateActivationUntil(body.until, now);
  await ensureLineCanBeActivated(lineId, now);

  const activation = {
    lineId,
    until: body.until,
    activatedAt: activatedAtHour(now),
    linkHash: body.linkHash,
    activatedBy: isaId,
  };
  await saveActivation(activation, false);
  logger.info('line activated with name', { lineId, until: activation.until, userId: isaId });
  return { until: activation.until, activatedAt: activation.activatedAt };
};

const wrongLink = (error: unknown) => {
  if (isConditionFailed(error)) throw new Error('Forbidden: This link does not manage a current activation');
  throw error;
};

const extendActivation = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, extendSchema);
  validateActivationUntil(body.until, new Date());
  await db.extendLineActivation(lineId, hashOf(body.code), body.until, nowSeconds()).catch(wrongLink);
  logger.info('activation extended', { lineId, until: body.until });
  return { until: body.until };
};

const deactivate = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, deactivateSchema);
  await db.endLineActivation(lineId, hashOf(body.code), nowSeconds()).catch(wrongLink);
  logger.info('line deactivated', { lineId });
  return {};
};

// Signed in, behind the contributor agreement.
export const signedInActivationRoutes: Record<string, Route> = {
  'POST /passes': jsonRoute(issuePasses),
  'POST /line/:id/activation/named': jsonRoute(activateWithName),
};

export const activationRoutes: Record<string, Route> = {
  'POST /line/:id/activation': jsonRoute(activateAnonymously),
  'PUT /line/:id/activation': jsonRoute(extendActivation),
  'DELETE /line/:id/activation': jsonRoute(deactivate),
};
