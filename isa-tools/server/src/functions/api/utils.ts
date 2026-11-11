import { Request, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';

export const expressRoute = (
  f: (req: Request<any, any, any, any>, res: Response, next?: any) => Promise<any>,
) => {
  return (req: Request, res: Response, next: any) => {
    f(req, res, next)
      .then((result) => {
        if (typeof result === 'object') {
          res.json(result);
        }
      })
      .catch(next);
  };
};

export const validateApiPayload = <T extends ZodTypeAny>(
  payload: unknown,
  schema: T,
): z.infer<T> => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation: ${error.issues[0].path?.[0]}: ${error.issues[0].message}.`);
    }
    throw error;
  }
};

export const verifyTrustedServiceRequest = (req: Request) => {
  if (!req.includesTrustedApiKey) {
    throw new Error('Unauthorized');
  }
};

export const verifyTrustedDomainRequest = (req: Request) => {
  if (!req.isFromTrustedDomain && !req.includesTrustedApiKey) {
    throw new Error('Unauthorized');
  }
};
