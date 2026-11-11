import { useFetch } from '../api';
import { LogoBackground } from '../components/LogoBackground';
import { Spinner } from '../components/Spinner';
import { VerifyResult } from '../types';

export function Verify() {
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const { data, isFetching } = useFetch<VerifyResult>(token ? `sign/verify?token=${token}` : null);

  return (
    <>
      <title>ISA Code Verification</title>
      <meta name="description" content="Verify ISA Codes" />
      <div className="stack verify">
        <LogoBackground zIndex={1} />
        <img className="full-width" src="/images/isa-logo-wide.svg" alt="ISA Logo" />

        {data?.isVerified && (
          <p className="note">
            This document was digitally signed for <b>{data.subject}</b> on <b>{data.issuedAt}</b>{' '}
            and is valid until <b> {data.expiresAt}</b>
          </p>
        )}

        {isFetching && <Spinner />}

        <h5 className="verify-result">
          {!token && 'There is no code to verify in the URL'}
          {data?.content}
        </h5>

        <p className="note">
          <b>verify.slacklineinternational.org</b> page confirms that the document was issued by the
          International Slackline Association. It uses standard cryptography to prevent forgery.
        </p>
      </div>
    </>
  );
}
