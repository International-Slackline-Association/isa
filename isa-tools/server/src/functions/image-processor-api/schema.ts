import { z } from 'zod';

export const processImageSchema = z
  .object({
    input: z.object({
      s3: z.object({
        bucket: z.string().max(256).optional(),
        key: z.string().max(1024),
      }),
    }),
    output: z.object({
      s3: z
        .object({
          bucket: z.string().max(256),
          key: z.string().max(1024),
        })
        .optional(),
      raw: z.boolean().optional(),
    }),
    outputFormat: z.enum(['jpeg', 'png', 'webp']),
    resize: z.object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
      scale: z.number().min(0).max(1).optional(),
    }),
    quality: z.number().positive().max(100).default(80),
    cacheControl: z.string().optional(),
  })
  .strip();
export type ProcessImagePostBody = z.infer<typeof processImageSchema>;
