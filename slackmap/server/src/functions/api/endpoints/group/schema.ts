import { z } from 'zod';

// Links render as hrefs, so only http(s) is allowed; zod's url() alone also accepts javascript:.
const link = (hosts?: string[]) =>
  z
    .string()
    .trim()
    .max(512)
    .url()
    .refine((value) => {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
      const host = url.hostname.toLowerCase();
      return !hosts || hosts.some((h) => host === h || host.endsWith(`.${h}`));
    }, 'must be a link to the matching site')
    .optional();

const groupFields = {
  geoJson: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.any()),
  }),
  name: z.string().trim().min(1).max(128),
  email: z.string().trim().max(254).email().optional(),
  facebookPage: link(['facebook.com', 'fb.com', 'fb.me']),
  facebookGroup: link(['facebook.com', 'fb.com', 'fb.me']),
  instagram: link(['instagram.com']),
  telegram: link(['t.me', 'telegram.me', 'telegram.org']),
  whatsapp: link(['whatsapp.com', 'wa.me']),
  webpage: link(),
  isaMemberType: z.enum(['active', 'observer', 'partner', 'associate']).optional(),
  isaMemberInfoUrl: link(),
};

export const createGroupSchema = z.object(groupFields).strict();
export type CreateGroupPostBody = z.infer<typeof createGroupSchema>;

// The body replaces the group: a field left out is removed.
export const updateGroupSchema = z.object(groupFields).strict();
export type UpdateGroupPostBody = z.infer<typeof updateGroupSchema>;
