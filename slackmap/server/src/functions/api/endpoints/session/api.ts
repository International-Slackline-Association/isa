import { issueSession } from '../../../../core/features/session';
import { Request, Route, json } from '../../../http';

const createSession = async (req: Request) => {
  const { cookies, expiresAt } = await issueSession(req.body?.token, req.headers);
  return { ...json({ expiresAt }), multiValueHeaders: { 'Set-Cookie': cookies } };
};

export const sessionRoutes: Record<string, Route> = {
  'POST /session': createSession,
};
