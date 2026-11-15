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

// API Gateway checks the scope on the /v1 resources, but routes match case-insensitively: /V1/sign
// reaches this Lambda through /{proxy+}, which has no authorizer.
export const requireAppScope = (request: Request, scope: string) => {
  if (!request.app?.scopes.includes(`isa-tools/${scope}`)) {
    throw new Error(`Unauthorized: the isa-tools/${scope} scope is required`);
  }
};
