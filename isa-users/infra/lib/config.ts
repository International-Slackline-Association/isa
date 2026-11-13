export const env = { account: '387132903656', region: 'eu-central-1' };

export const project = 'isa-users';
export const stage = 'prod';
export const namespace = `${project}-${stage}`;

export const domains = {
  web: 'account.slacklineinternational.org',
  api: 'account-api.slacklineinternational.org',
  // Profile pictures; slackmap builds the same URLs from the stored S3 keys.
  images: 'images.slacklineinternational.org',
  auth: 'auth.slacklineinternational.org',
};

// Wildcard *.slacklineinternational.org certificates of aws-platform's IsaShared (eu-central-1)
// and IsaSharedUsEast1 (us-east-1, for CloudFront and the Cognito domain).
export const certificates = {
  regional:
    'arn:aws:acm:eu-central-1:387132903656:certificate/6426c9d0-fd7d-4c55-a9da-49724983d4a0',
  cloudfront: 'arn:aws:acm:us-east-1:387132903656:certificate/7bf25d84-7109-481d-8d6d-035019870602',
};

export const userPool = {
  id: 'eu-central-1_iGaYGKeyJ',
  arn: 'arn:aws:cognito-idp:eu-central-1:387132903656:userpool/eu-central-1_iGaYGKeyJ',
  accountClientId: '59gg1oof4ik4nk46entj56lnnq',
};

export const tableName = `${namespace}-users`;
export const imagesBucketName = `${namespace}-images`;
export const cognitoTriggerFunctionName = `${namespace}-cognito-trigger`;

export const sesIdentityArn =
  'arn:aws:ses:eu-central-1:387132903656:identity/slacklineinternational.org';

export const isaTools = {
  temporaryUploadsBucketName: 'isa-tools-temporary-uploads-prod',
  trustedServiceApiKeyParameter: '/isa-tools-trusted-service-api-key',
};

// The weekly error digest runs as a GitHub Actions workflow of the monorepo, signed in through the
// account's GitHub OIDC provider (aws-platform, IsaShared).
export const errorDigest = {
  // GitHub's immutable subject: org and repo ids pinned, so a renamed or recreated repo cannot match.
  subject: 'repo:International-Slackline-Association@40061671/isa@1454138550:ref:refs/heads/main',
  roleName: 'isa-users-prod-error-digest',
  logGroupPrefix: 'isa-users-prod-app-',
};
