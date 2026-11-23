import { ResourcesConfig } from 'aws-amplify';

import { stage, uploadsIdentityPoolId, webOrigins } from 'app/api/constants';

const redirects = ['http://localhost:5173', ...webOrigins];

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_iGaYGKeyJ',
      userPoolClientId: '4f7vphq9s9ava93irhh2e7pieh',
      identityPoolId: uploadsIdentityPoolId,
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: 'auth.slacklineinternational.org',
          scopes: ['email', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: redirects,
          redirectSignOut: redirects,
          responseType: 'code',
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: `slackmap-${stage}-uploads`,
      region: 'eu-central-1',
    },
  },
};
