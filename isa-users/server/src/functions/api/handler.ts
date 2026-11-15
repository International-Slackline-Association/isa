import { createHandler } from '../http';
import { basicRoutes } from './endpoints/basic-api';
import { certificateRoutes } from './endpoints/certificate-api';
import { userRoutes } from './endpoints/user-api';
import { v1Routes } from './endpoints/v1-api';
import { verifyRoutes } from './endpoints/verify-api';

export const main = createHandler(
  'api',
  { ...basicRoutes, ...userRoutes, ...certificateRoutes, ...verifyRoutes, ...v1Routes },
  (path) => `${path} Not Found`,
);
