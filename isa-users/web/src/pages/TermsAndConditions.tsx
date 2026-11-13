import { LegalPage } from './LegalPage';

export function TermsAndConditions() {
  return (
    <LegalPage title="Terms of Use" effective="13 November 2026">
      <p>
        These terms apply to the ISA Account, run by the International Slackline Association (ISA),
        c/o Swiss Alpine-Club SAC, Monbijoustrasse 61, 3000 Bern 14, Switzerland. By creating or
        using an account you accept them. How we handle your data is in the{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>The account is free and personal: one account per person, not to be shared.</li>
        <li>Keep your sign-in details safe and your profile accurate.</li>
        <li>You can stop using the account and ask us to delete it at any time.</li>
      </ul>

      <h2>Fair use</h2>
      <p>
        Do not misuse the service: no false identities, no attempts to access other people's
        accounts or data, and nothing that disrupts the service. We may suspend or close an account
        that breaks these terms.
      </p>

      <h2>Certificates</h2>
      <p>
        Certificates and memberships shown in your account are issued by ISA under its own rules.
        The account only displays them; it does not create any right that ISA has not granted.
      </p>

      <h2>The service</h2>
      <p>
        ISA runs the account as a volunteer, non-profit service and provides it as it is. We may
        change, interrupt or end it. As far as the law allows, ISA is not liable for losses from
        using it or from it being unavailable; liability for intent and gross negligence remains.
      </p>
      <p>
        The source code is open source; its license is in the public repository. The ISA name and
        logo remain ISA's.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms and inform you of important changes by email. Swiss law applies;
        the courts of Bern, Switzerland, have jurisdiction, unless the law of your country gives
        you other rights as a consumer.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:account@slacklineinternational.org">account@slacklineinternational.org</a>
      </p>
    </LegalPage>
  );
}
