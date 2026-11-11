import { lazyLoad } from 'utils/loadable';

export const EquipmentWarnings = lazyLoad(
  () => import('./index'),
  (module) => module.EquipmentWarnings,
);
