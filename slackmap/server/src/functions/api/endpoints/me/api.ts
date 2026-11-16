import { z } from 'zod';
import { db } from '../../../../core/db';
import { Request, Route } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';

// Raise it when the agreement's text changes in substance: everyone accepts again.
export const contributorAgreementVersion = '2026-11';

const getAgreement = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const agreement = await db.getContributorAgreement(isaId);
  return { version: contributorAgreementVersion, accepted: agreement?.version === contributorAgreementVersion };
};

const acceptAgreement = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const { version } = validateApiPayload(req.body, z.object({ version: z.string() }));
  if (version !== contributorAgreementVersion) throw new Error('Validation: Outdated agreement version');
  await db.putContributorAgreement({ isaId, version, acceptedAt: new Date().toISOString() });
  return { version, accepted: true };
};

// Reads and removals need no agreement, so anyone can still take their content down.
export const requireAgreement = (routes: Record<string, Route>): Record<string, Route> =>
  Object.fromEntries(
    Object.entries(routes).map(([key, route]) => {
      if (key.startsWith('GET ') || key.toLowerCase().includes('delete')) return [key, route];
      const guarded: Route = async (req) => {
        if (req.user?.isaId) {
          const agreement = await db.getContributorAgreement(req.user.isaId);
          if (agreement?.version !== contributorAgreementVersion) {
            throw new Error('AgreementRequired: Accept the contributor agreement first');
          }
        }
        return route(req);
      };
      return [key, guarded];
    }),
  );

export const meRoutes: Record<string, Route> = {
  'GET /me/agreement': jsonRoute(getAgreement),
  'POST /me/agreement': jsonRoute(acceptAgreement),
};
