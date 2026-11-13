import { FormEvent, useState } from 'react';

import { post } from '../api';
import { Icon } from '../components/Icons';
import { Popup } from '../components/Popup';

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <main className="sign-in">
      <img alt="ISA Logo" src="/images/logo-wide.svg" className="sign-in-logo" />
      <ul className="benefits">
        <li>
          <Icon name="check" />
          <span>
            <b>Create</b> & <b>Manage</b> your ISA profile with your basic information.
          </span>
        </li>
        <li>
          <Icon name="check" />
          <span>
            Download your <b>verified certificates</b> and prove your <b>membership</b> to your
            clubs, associations etc.
          </span>
        </li>
        <li>
          <Icon name="check" />
          <span>
            Your information is <b>never sold</b> or used for advertising.
          </span>
        </li>
      </ul>
      <div className="sign-in-actions">
        <button className="button contained large" onClick={onSignIn}>
          <Icon name="lock" />
          Sign In / Sign Up
        </button>
        <Popup title="Can't sign in?" buttonClassName="button outlined large">
          <CannotAccessInfo />
        </Popup>
        <p className="consent">
          By signing up you accept the <a href="/terms">Terms of Use</a> and the{' '}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}

function CannotAccessInfo() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      await post('verify/send-email', { email: email.trim() });
      setState('sent');
    } catch {
      setState('idle');
    }
  };

  return (
    <div>
      <strong>Can't sign in or reset your password?</strong>
      <p>
        Most often your email is <b>not verified</b>: without a verified email, "Forgot password"
        cannot send you a reset code. Enter your email and we'll send you a verification link.
        Click it, then reset your password.
      </p>
      {state === 'sent' ? (
        <p className="notice">
          If an unverified account exists for this email, a verification link is on its way. Check
          your spam folder too. If your email is already verified, use "Forgot password" on the
          sign-in page.
        </p>
      ) : (
        <form className="inline-form" onSubmit={submit}>
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="button contained" disabled={state === 'sending'}>
            Send link
          </button>
        </form>
      )}
      <p>
        Still stuck, or haven't signed up yet with this email? Contact us and include the email
        address you registered with.
      </p>
      <a
        className="button outlined"
        href={`mailto:account@slacklineinternational.org?subject=${encodeURIComponent(
          'Cannot Access My ISA Account',
        )}&body=${encodeURIComponent('My email address is: ... \n')}`}
      >
        Contact Us
      </a>
    </div>
  );
}
