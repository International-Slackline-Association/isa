import { lazyLoad } from 'utils/loadable';

export const WorldFirsts = lazyLoad(
  () => import('./index'),
  (module) => module.WorldFirsts,
);
