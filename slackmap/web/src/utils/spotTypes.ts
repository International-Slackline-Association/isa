import { SpotType } from '@server/core/types';

export const spotTypeOptions: { value: SpotType; label: string }[] = [
  { value: 'highline', label: 'Highline' },
  { value: 'waterline', label: 'Waterline' },
  { value: 'park', label: 'Park' },
];
