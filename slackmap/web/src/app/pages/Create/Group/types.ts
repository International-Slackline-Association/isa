import { IsaMemberType } from '@server/core/types';

export interface GroupDetailsForm {
  name: string;
  email?: string;
  facebookPage?: string;
  facebookGroup?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  webpage?: string;
  isaMemberType?: IsaMemberType | '';
  isaMemberInfoUrl?: string;
}

export const groupLinkFields = [
  { field: 'facebookPage', label: 'Facebook Page' },
  { field: 'facebookGroup', label: 'Facebook Group' },
  { field: 'instagram', label: 'Instagram' },
  { field: 'telegram', label: 'Telegram Group' },
  { field: 'whatsapp', label: 'WhatsApp Group' },
  { field: 'webpage', label: 'Web Page' },
] as const;
