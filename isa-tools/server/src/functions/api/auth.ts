import type { Request } from '../http';

const trustedOrigins = [
  'verify.slacklineinternational.org',
  'tools.slacklineinternational.org',
  'localhost',
];

export const verifyTrustedDomainRequest = (request: Request) => {
  const origin = request.headers['origin'];
  const fromTrustedDomain = !!origin && trustedOrigins.some((trusted) => origin.includes(trusted));
  if (!fromTrustedDomain) {
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
