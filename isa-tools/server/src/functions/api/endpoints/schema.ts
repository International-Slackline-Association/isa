import { z } from 'zod';

export const listCertificatesQueryParamsSchema = z
  .object({
    isaId: z.string().optional(),
    email: z.string().optional(),
    certificateType: z.string().optional(),
  })
  .strip();

export type ListCertificatesQueryParams = z.infer<typeof listCertificatesQueryParamsSchema>;

export const generateCertificatePostBodySchema = z
  .object({
    certificateType: z.string(),
    certificateId: z.string(),
    subject: z.string(),
    language: z.string(),
  })
  .strip();

export type GenerateCertificatePostBody = z.infer<typeof generateCertificatePostBodySchema>;

export const signDocumentPostBodySchema = z
  .object({
    subject: z.string(),
    expiresInSeconds: z.number(),
    createHash: z.boolean().optional(),
    content: z.string().max(1024).min(10),
  })
  .strip();

export type SignDocumentePostBody = z.infer<typeof signDocumentPostBodySchema>;
