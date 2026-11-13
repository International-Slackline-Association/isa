import { useEffect, useState } from 'react';

import { fetchUserAttributes } from 'aws-amplify/auth';

import { post } from '../api';

export function VerifyEmailBanner() {
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    fetchUserAttributes()
      .then((attributes) => {
        if (attributes.email_verified !== 'true') setUnverifiedEmail(attributes.email);
      })
      .catch((error) => console.error(error));
  }, []);

  if (!unverifiedEmail) return null;
  const email = unverifiedEmail;

  const send = async () => {
    setState('sending');
    try {
      await post('verify/send-email', { email });
      setState('sent');
    } catch {
      setState('idle');
    }
  };

  return (
    <div className="banner" role="status">
      {state === 'sent' ? (
        <span>
          A verification link is on its way to <b>{email}</b>. Click it to verify your email.
        </span>
      ) : (
        <>
          <span>
            Your email <b>{email}</b> is not verified. Without it you cannot reset your password.
          </span>
          <button className="button outlined" onClick={send} disabled={state === 'sending'}>
            Send verification email
          </button>
        </>
      )}
    </div>
  );
}
