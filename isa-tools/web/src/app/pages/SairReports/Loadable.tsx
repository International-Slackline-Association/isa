import { lazyLoad } from 'utils/loadable';

export const SairReports = lazyLoad(
  () => import('./index'),
  (module) => module.SairReports,
);
