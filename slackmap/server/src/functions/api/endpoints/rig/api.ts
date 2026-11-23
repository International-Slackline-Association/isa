import { z } from 'zod';
import { db } from '../../../../core/db';
import {
  currentMonth,
  hashOf,
  isPassValid,
  passCountExpiry,
  passesPerMonth,
  reportedAtHour,
  signBlindedPass,
  validateRigUntil,
} from '../../../../core/features/rig';
import { logger } from '../../../../core/logger';

import { Request, Route } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';

const bytes = z.string().max(2048).transform((value, ctx) => {
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid base64url' });
  return new Uint8Array(decoded);
});
const passesSchema = z.object({ blindedPasses: z.array(bytes).min(1).max(passesPerMonth) });
const reportSchema = z.object({
  until: z.number().int(),
  pass: bytes,
  signature: bytes,
  linkHash: z.string().regex(/^[0-9a-f]{64}$/),
});
const extendSchema = z.object({ until: z.number().int(), code: z.string().min(16).max(128) });
const endSchema = z.object({ code: z.string().min(16).max(128) });

const isConditionFailed = (error: unknown) =>
  (error as Error)?.name === 'ConditionalCheckFailedException';

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

// No login is read on the routes below: a valid, unspent pass is all that says a member sent it.
const reportRig = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, reportSchema);
  const now = new Date();
  validateRigUntil(body.until, now);
  if (!(await isPassValid(body.pass, body.signature))) throw new Error('Forbidden: Invalid pass');
  if (!(await db.getLineDetails(lineId))) throw new Error(`NotFound: Line ${lineId} not found`);
  const existing = await db.getLineRig(lineId);
  if (existing && existing.until > now.getTime() / 1000) {
    throw new Error('Validation: This line is already reported rigged');
  }

  await db.spendPass(hashOf(body.pass)).catch((error) => {
    if (isConditionFailed(error)) throw new Error('Forbidden: Pass already used');
    throw error;
  });
  const rig = { lineId, until: body.until, reportedAt: reportedAtHour(now), linkHash: body.linkHash };
  await db.putLineRig(rig, Math.floor(now.getTime() / 1000)).catch((error) => {
    if (isConditionFailed(error)) throw new Error('Validation: This line is already reported rigged');
    throw error;
  });
  logger.info('rig reported', { lineId, until: rig.until });
  return { until: rig.until, reportedAt: rig.reportedAt };
};

const wrongLink = (error: unknown) => {
  if (isConditionFailed(error)) throw new Error('Forbidden: This link does not manage the rig');
  throw error;
};

const extendRig = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, extendSchema);
  validateRigUntil(body.until, new Date());
  await db.extendLineRig(lineId, hashOf(body.code), body.until).catch(wrongLink);
  logger.info('rig extended', { lineId, until: body.until });
  return { until: body.until };
};

const endRig = async (req: Request<{ id: string }>) => {
  const lineId = req.params.id;
  const body = validateApiPayload(req.body, endSchema);
  await db.endLineRig(lineId, hashOf(body.code)).catch(wrongLink);
  logger.info('rig taken down', { lineId });
  return {};
};

export const passRoutes: Record<string, Route> = {
  'POST /passes': jsonRoute(issuePasses),
};

// http.ts logs these without anything that could point to the person.
export const rigRoutes: Record<string, Route> = {
  'POST /line/:id/rig': jsonRoute(reportRig),
  'PUT /line/:id/rig': jsonRoute(extendRig),
  'DELETE /line/:id/rig': jsonRoute(endRig),
};
