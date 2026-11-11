import { lazyLoad } from 'utils/loadable';

export const CertifiedGears = lazyLoad(
  () => import('./index'),
  (module) => module.CertifiedGears,
);
