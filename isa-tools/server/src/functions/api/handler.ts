import { createHandler } from '../http';
import { certificateRoutes } from './endpoints/certificate-api';
import { listingsRoutes } from './endpoints/listings-api';
import { signRoutes } from './endpoints/sign-api';

export const main = createHandler(
  'api',
  { ...certificateRoutes, ...listingsRoutes, ...signRoutes },
  (path) => `${path} Not Found`,
);
