import * as db from '../../../core/db';
import { logger } from '../../../core/logger';
import type { Request } from '../../http';
import { jsonRoute } from '../utils';

// DynamoDB's BatchGetItem limit.
const maxIds = 100;

// API Gateway checks the scope on the /v1 resources, but routes match case-insensitively: /V1/users
// reaches this Lambda through /{proxy+}, whose authorizer takes any user's token.
const requireScope = (request: Request, scope: string) => {
  if (!request.app?.scopes.includes(`isa-users/${scope}`)) {
    throw new Error(`Forbidden: the isa-users/${scope} scope is required`);
  }
};

// For other apps' servers; which app may call it is declared in infra config.
export const getUsers = async (request: Request) => {
  requireScope(request, 'users.get');
  const ids = [...new Set((request.query.ids ?? '').split(',').filter(Boolean))];
  if (ids.length === 0 || ids.length > maxIds) {
    throw new Error(`ids must list 1 to ${maxIds} ISA ids, comma-separated`);
  }
  const users = await db.getUsers(ids);
  logger.info('Users read by app', { app: request.app?.clientId, requested: ids.length, found: users.length });

  return {
    users: users.map((user) => ({
      isaId: user.userId,
      email: user.email,
      name: user.name,
      surname: user.surname,
      gender: user.gender,
      birthDate: user.birthDate,
      phoneNumber: user.phoneNumber,
      city: user.city,
      country: user.country,
      profilePictureUrl: user.profilePictureS3Key
        ? `https://images.slacklineinternational.org/${user.profilePictureS3Key}`
        : undefined,
      createdDateTime: user.createdDateTime,
    })),
  };
};

export const v1Routes = {
  'GET /v1/users': jsonRoute(getUsers),
};
