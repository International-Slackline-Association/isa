import { lazyLoad } from 'utils/loadable';

export const WorldRecords = lazyLoad(
  () => import('./index'),
  (module) => module.WorldRecords,
);
