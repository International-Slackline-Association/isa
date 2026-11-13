import { LegalPage } from './LegalPage';

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" effective="13 November 2026">
      <p>
        This policy explains how the International Slackline Association (ISA) handles personal
        data in the ISA Account: the account you sign in with on account.slacklineinternational.org
        and on other apps that offer "Sign in with ISA". It follows the Swiss Federal Act on Data
        Protection (FADP) and, for people in the European Union, the General Data Protection
        Regulation (GDPR).
      </p>

      <h2>Who is responsible</h2>
      <p>
        International Slackline Association, c/o Swiss Alpine-Club SAC, Monbijoustrasse 61, 3000
        Bern 14, Switzerland. Contact for anything about your data:{' '}
        <a href="mailto:account@slacklineinternational.org">account@slacklineinternational.org</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <b>Account:</b> email address and password. The password is stored only as a secure hash
          by our sign-in service; we never see it.
        </li>
        <li>
          <b>Profile:</b> name, surname and gender, and, if you add them, birth date, phone number,
          city, country and a profile picture.
        </li>
        <li>
          <b>Your ISA ID</b>, which we create when you sign up.
        </li>
        <li>
          <b>Certificates</b> ISA has issued to you (for example instructor, rigger, records), with
          your name, email and ISA ID, and the PDFs you generate from them.
        </li>
        <li>
          <b>Technical logs:</b> when you use the app our servers record the request, the time,
          your ISA ID, your browser type and the website you came from. We do not log your IP
          address.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your account and let you sign in to ISA apps (contract with you).</li>
        <li>
          To issue, show and verify your ISA certificates and memberships (contract with you).
        </li>
        <li>
          Gender and birth date: for the gender and age categories of Slackline Sport, ISA's
          competition and ranking app (contract with you).
        </li>
        <li>Phone number: so ISA can contact you about your certificates (contract with you).</li>
        <li>
          To keep the service secure and fix errors, using the technical logs (our legitimate
          interest).
        </li>
      </ul>
      <p>We do not sell your data, use it for advertising, or track you across other websites.</p>

      <h2>What is public and who receives your data</h2>
      <ul>
        <li>
          <b>Public:</b> your profile picture is publicly reachable by its address. On SlackMap
          (slackmap.com), your name, profile picture and country are shown next to the lines, spots
          and groups you add or edit. Anyone who checks a certificate on
          verify.slacklineinternational.org sees the holder's name and the certificate. When you
          send a message or a request to other people through SlackMap, they receive your email
          address so they can reply.
        </li>
        <li>
          <b>Apps you sign in to:</b> when you use "Sign in with ISA" on another app, that app
          receives your email address and, depending on the app, your name and other profile
          fields. Some of these apps are run by other slackline organisations and teams, not by ISA;
          their own privacy policies apply to what they do with it.
        </li>
        <li>
          <b>Service providers</b> who store or process data for us: Amazon Web Services (hosting,
          sign-in, email sending), in Frankfurt, Germany; Google (Google Sheets, where ISA keeps its
          certificate records). Both are US companies; data may be accessible from the USA,
          protected by the Swiss-US and EU-US Data Privacy Frameworks and standard contractual
          clauses.
        </li>
        <li>Authorities, only where the law requires it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your account and profile: until you ask us to delete your account.</li>
        <li>
          Certificates: as long as ISA keeps its certificate records, so that a certificate can
          still be verified. A generated PDF is kept 90 days.
        </li>
        <li>
          Profile pictures: a picture you replace or remove goes offline within 10 days and is
          deleted within a year; the original upload is kept 90 days.
        </li>
        <li>Technical logs: 3 months.</li>
        <li>Backups: up to 2 years, after which deleted data is gone from them too.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of your data, to correct it, to delete it or to hand it over to
        you in a common format, and you can object to how we use it. Most profile fields you can
        change yourself in the app. To delete your account or for anything else, email{' '}
        <a href="mailto:account@slacklineinternational.org">account@slacklineinternational.org</a>{' '}
        from the address you signed up with. We answer within 30 days.
      </p>
      <p>
        You can also complain to the Swiss Federal Data Protection and Information Commissioner
        (FDPIC) or, in the EU, to the data protection authority of your country.
      </p>

      <h2>Children</h2>
      <p>
        You must be at least 16 to create an account. Younger people need the consent of a parent
        or guardian.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit and stored with access limited to the people who run the
        service. If a breach puts your data at risk, we inform you and the authorities as the law
        requires.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The date above shows the current version; for important changes
        we inform you by email.
      </p>
    </LegalPage>
  );
}
