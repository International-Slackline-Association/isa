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
        <p className="consent">
          By signing up you accept the <a href="/terms">Terms of Use</a> and the{' '}
          <a href="/privacy">Privacy Policy</a>.
        </p>
        <span className="secondary">or</span>
        <Popup title="Cannot access your account?">
          <CannotAccessInfo />
        </Popup>
      </div>
    </main>
  );
}

function CannotAccessInfo() {
  return (
    <div>
      <strong>Having problems accesing your account?</strong>
      <p>There might be several reasons why you cannot access your account. For example:</p>
      <ul>
        <li>You have NOT YET signed up. Make sure you create an account first!</li>
        <li>You have not yet verified your email and therefore you cannot reset your password.</li>
        <li>Your account is disabled.</li>
      </ul>
      <p>
        In such cases, please contact us via email (click below). You <b>need</b> to attach your
        email address that you are registered with to the email!
      </p>
      <a
        className="button contained"
        href={`mailto:account@slacklineinternational.org?subject=${encodeURIComponent(
          'Cannot Access My ISA Account',
        )}&body=${encodeURIComponent('My email address is: ... \n')}`}
      >
        Contact Us
      </a>
    </div>
  );
}
