import { useEffect, useState } from 'react';

import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export const uploadsBucket = 'isa-tools-temporary-uploads-prod';

export function configureAuth() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'eu-central-1_iGaYGKeyJ',
        userPoolClientId: '59gg1oof4ik4nk46entj56lnnq',
        identityPoolId: 'eu-central-1:e48c1559-25cd-41be-ba2b-2c8a42e3533a',
        loginWith: {
          oauth: {
            domain: 'auth.slacklineinternational.org',
            scopes: ['email', 'openid', 'aws.cognito.signin.user.admin'],
            redirectSignIn: ['http://localhost:5173', 'https://account.slacklineinternational.org'],
            redirectSignOut: ['http://localhost:5173', 'https://account.slacklineinternational.org'],
            responseType: 'code',
          },
        },
      },
    },
    Storage: { S3: { bucket: uploadsBucket, region: 'eu-central-1' } },
  });
}

export type AuthState = 'loading' | 'signedIn' | 'signedOut';

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    const stop = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') setState('signedIn');
      if (payload.event === 'signedOut') setState('signedOut');
    });
    getCurrentUser()
      .then(() => setState('signedIn'))
      .catch(() => {
        setState('signedOut');
        signOut();
      });
    return stop;
  }, []);

  return {
    state,
    signIn: () => {
      setState('loading');
      signInWithRedirect();
    },
    signOut: () => {
      setState('loading');
      signOut();
    },
  };
}

export async function idToken() {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString();
}
