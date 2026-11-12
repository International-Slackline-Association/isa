import * as db from '../../core/db';
import { json } from '../http';
import type { Request } from '../http';

export const jsonRoute = (f: (request: Request) => Promise<unknown>) => {
  return async (request: Request) => json(await f(request));
};

export const validateUserExists = async (userId: string) => {
  const user = await db.getUser(userId);
  if (!user) {
    throw new Error(`User ${userId} does not exist`);
  }
  return user;
};
