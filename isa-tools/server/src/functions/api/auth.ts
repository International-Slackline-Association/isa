import type { Request } from '../http';

const trustedOrigins = [
  'verify.slacklineinternational.org',
  'tools.slacklineinternational.org',
  'localhost',
];

const hasTrustedApiKey = (request: Request) => {
  const key = process.env.ISA_DOCUMENTS_TRUSTED_SERVICE_API_KEY;
  return !!key && request.headers['x-api-key'] === key;
};

export const verifyTrustedServiceRequest = (request: Request) => {
  if (!hasTrustedApiKey(request)) {
    throw new Error('Unauthorized');
  }
};

export const verifyTrustedDomainRequest = (request: Request) => {
  const origin = request.headers['origin'];
  const fromTrustedDomain = !!origin && trustedOrigins.some((trusted) => origin.includes(trusted));
  if (!fromTrustedDomain && !hasTrustedApiKey(request)) {
    throw new Error('Unauthorized');
  }
};
