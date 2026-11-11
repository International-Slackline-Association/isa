import { lazyLoad } from 'utils/loadable';

export const CertifiedRiggers = lazyLoad(
  () => import('./index'),
  (module) => module.CertifiedRiggers,
);
