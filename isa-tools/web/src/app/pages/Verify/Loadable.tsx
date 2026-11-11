import { lazyLoad } from 'utils/loadable';

export const Verify = lazyLoad(
  () => import('./index'),
  (module) => module.Verify,
);
