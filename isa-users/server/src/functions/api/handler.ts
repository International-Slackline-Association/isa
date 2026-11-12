import { createHandler } from '../http';
import { basicRoutes } from './endpoints/basic-api';
import { certificateRoutes } from './endpoints/certificate-api';
import { userRoutes } from './endpoints/user-api';
import { verifyRoutes } from './endpoints/verify-api';

export const main = createHandler(
  'api',
  { ...basicRoutes, ...userRoutes, ...certificateRoutes, ...verifyRoutes },
  (path) => `${path} Not Found`,
);
