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

export const alarmEmail = 'aws@slacklineinternational.org';
