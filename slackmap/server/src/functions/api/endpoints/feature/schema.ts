import { z } from 'zod';

export const deleteFeatureRequestSchema = z.object({
  reason: z.string().trim().min(1).max(1024),
});
export type DeleteFeatureRequestPostBody = z.infer<typeof deleteFeatureRequestSchema>;
