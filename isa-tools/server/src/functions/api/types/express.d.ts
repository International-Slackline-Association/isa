import 'express';

declare global {
  namespace Express {
    interface Request {
      includesTrustedApiKey?: boolean;
      isFromTrustedDomain?: boolean;
    }
  }
}
