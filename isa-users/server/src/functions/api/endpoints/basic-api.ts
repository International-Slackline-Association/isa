import * as db from '../../../core/db';
import type { Request } from '../../http';
import { jsonRoute } from '../utils';

export const getUserDetails = async (request: Request) => {
  const isaId = request.user!.isaId;
  const details = await db.getUser(isaId);

  if (!details) {
    throw new Error(`User ${isaId} not found`);
  }

  const response = {
    isaId,
    name: details.name,
    surname: details.surname,
    email: details.email,
    profilePictureUrl: details.profilePictureS3Key
      ? `https://images.slacklineinternational.org/${details.profilePictureS3Key}`
      : undefined,
  };

  return response;
};

export const basicRoutes = {
  'GET /basic/userDetails': jsonRoute(getUserDetails),
};
