import { ResourcesConfig } from 'aws-amplify';

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_iGaYGKeyJ',
      userPoolClientId: '4f7vphq9s9ava93irhh2e7pieh',
      identityPoolId: 'eu-central-1:3dc66cc0-5875-41b1-b83a-c17aa357a8d9',
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: 'auth.slacklineinternational.org',
          scopes: ['email', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [
            'http://localhost:5173',
            'https://slackmap.com',
            'https://www.slackmap.com',
          ],
          redirectSignOut: [
            'http://localhost:5173',
            'https://slackmap.com',
            'https://www.slackmap.com',
          ],
          responseType: 'code',
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'isa-tools-temporary-uploads-prod',
      region: 'eu-central-1',
    },
  },
};
