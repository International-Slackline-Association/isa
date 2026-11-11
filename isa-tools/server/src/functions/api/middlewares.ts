import { logger } from 'core/utils/logger';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

const trustedOrigins = [
  'verify.slacklineinternational.org',
  'tools.slacklineinternational.org',
  'localhost',
];

export const injectCommonlyUsedHeadersMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.headers['x-api-key'] === process.env.ISA_DOCUMENTS_TRUSTED_SERVICE_API_KEY) {
    req.includesTrustedApiKey = true;
  }

  const origin = req.headers['origin'];
  if (origin && trustedOrigins.some((trusted) => origin.includes(trusted))) {
    req.isFromTrustedDomain = true;
  }

  next();
};
export const errorMiddleware: ErrorRequestHandler = async (error, req, res, next) => {
  if (!error) {
    next();
    return;
  }
  const message = error.message || 'Error occurred';
  const stack = error.stack;

  logger.error(message, {
    httpRequest: { path: req.path, body: req.body, method: req.method, query: req.query },
    stack,
  });
  res.status(500).json({
    status: 500,
    message,
    stack,
  });
};

export const notFoundMiddleware = (_req: Request, res: Response, _next: NextFunction) => {
  console.log(_req.path);
  res.status(404).json({ message: `${_req.path} Not Found` });
};
