import { lazyLoad } from 'utils/loadable';

export const UserProfilePage = lazyLoad(
  () => import('./index'),
  (module) => module.UserProfilePage,
);
