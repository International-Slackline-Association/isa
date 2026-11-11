import { lazyLoad } from 'utils/loadable';

export const CertifiedInstructors = lazyLoad(
  () => import('./index'),
  (module) => module.CertifiedInstructors,
);
