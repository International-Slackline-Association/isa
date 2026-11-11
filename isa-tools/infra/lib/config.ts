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

// isa-users and slackmap upload to this name directly from their web apps.
export const temporaryUploadsBucketName = 'isa-tools-temporary-uploads-prod';

// The image processor writes resized images under public/ of these.
export const imageBucketNames = ['isa-users-images-prod', 'slackmap-images-prod'];

export const trustedServiceApiKeyParameter = '/isa-tools-trusted-service-api-key';

export const alarmEmail = 'aws@slacklineinternational.org';
