export const env = { account: '387132903656', region: 'eu-central-1' };

export const domains = {
  api: 'tools-api.slacklineinternational.org',
  // verify: printed in every issued QR code. tools: embedded by data.slacklineinternational.org.
  web: ['verify.slacklineinternational.org', 'tools.slacklineinternational.org'],
};

// Wildcard *.slacklineinternational.org certificates of aws-platform's IsaShared (eu-central-1)
// and IsaSharedUsEast1 (us-east-1, for CloudFront).
export const certificates = {
  regional:
    'arn:aws:acm:eu-central-1:387132903656:certificate/6426c9d0-fd7d-4c55-a9da-49724983d4a0',
  cloudfront: 'arn:aws:acm:us-east-1:387132903656:certificate/7bf25d84-7109-481d-8d6d-035019870602',
};

export const tableName = 'isa-tools-documents';

export const temporaryUploadsBucketName = 'isa-tools-temporary-uploads-prod';

// isa-users' pool, which issues other apps' access tokens.
export const userPool = {
  id: 'eu-central-1_iGaYGKeyJ',
  arn: 'arn:aws:cognito-idp:eu-central-1:387132903656:userpool/eu-central-1_iGaYGKeyJ',
};
export const apiScopeServer = 'isa-tools';
export const apiScopes = {
  'documents.sign': 'POST /v1/sign',
  'certificates.list': 'GET /v1/certificates',
  'certificates.generate': 'POST /v1/certificates/generate',
} as const;

// The weekly error digest runs as a GitHub Actions workflow of the monorepo, signed in through the
// account's GitHub OIDC provider (aws-platform, IsaShared).
export const errorDigest = {
  // GitHub's immutable subject: org and repo ids pinned, so a renamed or recreated repo cannot match.
  subject: 'repo:International-Slackline-Association@40061671/isa@1454138550:ref:refs/heads/main',
  roleName: 'isa-tools-prod-error-digest',
  logGroupPrefix: 'IsaToolsApp-',
};
