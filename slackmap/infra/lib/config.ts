export const env = { account: '387132903656', region: 'eu-central-1' };

export const project = 'slackmap';
export const stage = 'prod';
export const namespace = `${project}-${stage}`;

export const domains = {
  web: ['slackmap.com', 'www.slackmap.com'],
  api: 'api.slackmap.com',
  data: 'data.slackmap.com',
  images: 'images.slackmap.com',
};

// slackmap.com and *.slackmap.com, issued by hand.
export const certificates = {
  cloudfront: 'arn:aws:acm:us-east-1:387132903656:certificate/e4def0fa-44e6-411b-89d0-d5223539966e',
};

export const tableName = `${namespace}-db`;
// Set by the stream of the table in the data stack; changes only if the stream is recreated.
export const tableStreamArn =
  'arn:aws:dynamodb:eu-central-1:387132903656:table/slackmap-prod-db/stream/2026-11-12T13:16:15.858';
export const imagesBucketName = `${namespace}-images`;
export const applicationDataBucketName = `${namespace}-application-data`;

// CloudFront delivers its access logs to CloudWatch only in us-east-1.
export const usEast1Env = { account: env.account, region: 'us-east-1' };
// Set by the distributions of the app stack; change only if a distribution is recreated.
export const distributionIds = { data: 'EWDMK7QRJ5I98', images: 'E1S62AITVZ4WPH' };
export const cdnAccessLogGroupName = `${namespace}-cdn-access`;

export const geonamesUsernameParameter = 'slackmap-geonames-api-username';
export const sesIdentityArn =
  'arn:aws:ses:eu-central-1:387132903656:identity/slacklineinternational.org';

export const isaUsers = {
  userPoolId: 'eu-central-1_iGaYGKeyJ',
  slackmapClientId: '4f7vphq9s9ava93irhh2e7pieh',
  tableName: 'isa-users-prod-users',
};

export const isaTools = {
  temporaryUploadsBucketName: 'isa-tools-temporary-uploads-prod',
  trustedServiceApiKeyParameter: '/isa-tools-trusted-service-api-key',
};

// The error digest runs as a GitHub Actions workflow of this repo, signed in through
// the account's GitHub OIDC provider (aws-platform, IsaShared).
export const errorDigest = {
  repo: 'International-Slackline-Association/isa',
  roleName: `${namespace}-error-digest`,
};

// The ISA account of slackmap@slacklineinternational.org.
export const slackmapAdminIsaId = 'ISA_C87BE5F6';
