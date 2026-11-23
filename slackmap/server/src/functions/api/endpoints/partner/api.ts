import { issueAppSession } from '../../../../core/features/session';
import { AppRoute, Request, json } from '../../../http';

const createAppSession = async (req: Request) => {
  const { cookies, values, expiresAt } = await issueAppSession(req.app!.clientId);
  // A partner's server sends these as a Cookie header to data.; a browser would take the Set-Cookie.
  const cookieHeader = Object.entries(values)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return { ...json({ expiresAt, cookieHeader }), multiValueHeaders: { 'Set-Cookie': cookies } };
};

export const partnerRoutes: Record<string, AppRoute> = {
  'POST /v1/session': { scope: 'data.read', route: createAppSession },
};
