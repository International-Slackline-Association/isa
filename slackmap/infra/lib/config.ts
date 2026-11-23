export const env = { account: '387132903656', region: 'eu-central-1' };

export const project = 'slackmap';

const stages = {
  prod: {
    domain: 'slackmap.com',
    // slackmap.com and *.slackmap.com, issued by hand.
    certificate: 'arn:aws:acm:us-east-1:387132903656:certificate/e4def0fa-44e6-411b-89d0-d5223539966e',
    // Set by the stream of the table in the data stack; changes only if the stream is recreated.
    tableStreamArn:
      'arn:aws:dynamodb:eu-central-1:387132903656:table/slackmap-prod-db/stream/2026-11-12T13:16:15.858',
    passes: { signingKeyParameter: 'slackmap-pass-signing-key', perMonth: 10 },
  },
  test: {
    domain: 'test.slackmap.com',
    // test.slackmap.com and *.test.slackmap.com, issued by hand.
    certificate: 'arn:aws:acm:us-east-1:387132903656:certificate/6da1b5c9-1f7c-487e-80e4-ce9ec49f88e5',
    tableStreamArn: 'arn:aws:dynamodb:eu-central-1:387132903656:table/slackmap-test-db/stream/2026-11-23T15:16:28.282',
    passes: { signingKeyParameter: 'slackmap-test-pass-signing-key', perMonth: 50 },
  },
};
const given = process.env.STAGE;
if (given !== 'prod' && given !== 'test') throw new Error('STAGE must be prod or test');
export const stage = given;
export const isProd = stage === 'prod';
export const namespace = `${project}-${stage}`;
const { domain, certificate, tableStreamArn: streamArn, passes: stagePasses } = stages[stage];

export const webDomain = domain;
export const domains = {
  web: isProd ? [domain, `www.${domain}`] : [domain],
  api: `api.${domain}`,
  data: `data.${domain}`,
  images: `images.${domain}`,
};

export const certificates = { cloudfront: certificate };

export const tableName = `${namespace}-db`;
export const tableStreamArn = streamArn;
export const uploadsBucketName = `${namespace}-uploads`;
export const imagesBucketName = `${namespace}-images`;
export const applicationDataBucketName = `${namespace}-application-data`;

// CloudFront delivers its access logs to CloudWatch only in us-east-1.
export const usEast1Env = { account: env.account, region: 'us-east-1' };
// Prod only. Set by the distributions of the app stack; change only if a distribution is recreated.
export const distributionIds = { data: 'EWDMK7QRJ5I98', images: 'E1S62AITVZ4WPH' };
export const cdnAccessLogGroupName = `${namespace}-cdn-access`;

export const dataAccess = {
  // Off: cookies are issued and logged but not required. On: data. and the API turn away requests without one.
  // Off on test: prod's cookies, set for every slackmap.com host, reach test's hosts too under the same names.
  enforced: isProd,
  turnstileSecretParameter: 'slackmap-turnstile-secret',
  signingKeyParameter: 'slackmap-session-signing-key',
  originSecretParameter: 'slackmap-origin-secret',
  webOrigins: domains.web.map((d) => `https://${d}`),
};
export const sessionsTableName = `${namespace}-sessions`;

export const passes = stagePasses;

export const geonamesUsernameParameter = 'slackmap-geonames-api-username';
export const sesIdentityArn =
  'arn:aws:ses:eu-central-1:387132903656:identity/slacklineinternational.org';

export const isaUsers = {
  userPoolId: 'eu-central-1_iGaYGKeyJ',
  slackmapClientId: '4f7vphq9s9ava93irhh2e7pieh',
  apiUrl: 'https://account-api.slacklineinternational.org',
  tokenUrl: 'https://auth.slacklineinternational.org/oauth2/token',
  // slackmap's own client for the API (slackmap-service).
  serviceClientId: '5ok76eocc9lbkp6go3f2179ej2',
  serviceClientSecretParameter: 'slackmap-isa-users-client-secret',
};

// The error digest runs as a GitHub Actions workflow of this repo, signed in through
// the account's GitHub OIDC provider (aws-platform, IsaShared).
export const errorDigest = {
  // GitHub's immutable subject: org and repo ids pinned, so a renamed or recreated repo cannot match.
  subject: 'repo:International-Slackline-Association@40061671/isa@1454138550:ref:refs/heads/main',
  roleName: `${namespace}-error-digest`,
};

// The ISA account of slackmap@slacklineinternational.org.
export const slackmapAdminIsaId = 'ISA_C87BE5F6';
