import { z } from 'zod';

// A message goes to a user, or to the email written in a line's or spot's contact info; never to an
// address the caller chooses.
const recipientSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('userId'), userId: z.string() }),
  z.object({
    type: z.literal('featureContact'),
    featureId: z.string(),
    featureType: z.enum(['line', 'spot']),
  }),
]);

export const sendUserMessageSchema = z.object({
  recipient: recipientSchema,
  context_url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u)),
  message: z.string().trim().min(1).max(4096),
});
export type SendUserMessagePostBody = z.infer<typeof sendUserMessageSchema>;
