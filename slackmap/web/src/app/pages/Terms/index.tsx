import { Box, Link, Typography } from '@mui/material';

const contact = 'slackmap@slacklineinternational.org';

const Section = (props: { id?: string; title: string; children: React.ReactNode }) => (
  <Box component="section" id={props.id} sx={{ marginTop: 3 }}>
    <Typography variant="h6" component="h2" gutterBottom>
      {props.title}
    </Typography>
    {props.children}
  </Box>
);

const P = (props: { children: React.ReactNode }) => (
  <Typography variant="body2" component="p" sx={{ marginBottom: 1.5 }}>
    {props.children}
  </Typography>
);

export const TermsPage = () => (
  <Box sx={{ height: '100vh', overflowY: 'auto', width: '100%' }}>
    <Box sx={{ maxWidth: 720, margin: '0 auto', padding: { xs: '72px 16px 32px', lg: '32px 24px' } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Terms of use and data use policy
      </Typography>
      <Typography variant="caption">Effective 17 November 2026</Typography>

      <Section title="Who we are">
        <P>
          SlackMap (slackmap.com) is run by the International Slackline Association (ISA), c/o Swiss
          Alpine-Club SAC, Monbijoustrasse 61, 3000 Bern 14, Switzerland. By using SlackMap you accept
          these terms. How SlackMap handles personal data is under <Link href="#privacy">Privacy</Link>{' '}
          below; your ISA Account has its own{' '}
          <Link href="https://account.slacklineinternational.org/privacy">Privacy Policy</Link>.
        </P>
      </Section>

      <Section title="Free for slackliners">
        <P>
          You may use SlackMap for free to look up, plan and document slacklining: browse the map, read
          the details, share links to lines, spots and guides, and share a screenshot of a single item
          with the credit "SlackMap / ISA".
        </P>
      </Section>

      <Section title="What needs our written permission">
        <P>Without written permission from ISA you may not:</P>
        <ul>
          <li>
            <Typography variant="body2">
              access slackmap.com, api.slackmap.com, data.slackmap.com or images.slackmap.com with
              scripts, bots, crawlers or scrapers, other than search engines indexing public pages and
              link previews of a shared link;
            </Typography>
          </li>
          <li>
            <Typography variant="body2">download or copy the map data in bulk;</Typography>
          </li>
          <li>
            <Typography variant="body2">
              republish, mirror or redistribute the map data, or use it in another app, website,
              service or internal system;
            </Typography>
          </li>
          <li>
            <Typography variant="body2">use the map data to train or feed AI models;</Typography>
          </li>
          <li>
            <Typography variant="body2">
              get around our technical measures, such as the browser check, usage limits, or faking
              request headers.
            </Typography>
          </li>
        </ul>
        <P>
          Breaking these terms ends your permission to use SlackMap. We may block access, ask for
          copies to be deleted and take legal action.
        </P>
      </Section>

      <Section title="Who owns the data">
        <P>
          The map data as a whole, and its selection, review and presentation, belong to ISA; all rights
          are reserved. Contributors keep ownership of what they add and license it to ISA under the
          contributor agreement below. The ISA and SlackMap names and logos remain ISA's. The source
          code is open source under its own license; that license does not cover the map data.
        </P>
      </Section>

      <Section title="Partner access">
        <P>
          Want to use SlackMap data in your own project, federation or research? Write to{' '}
          <Link href={`mailto:${contact}`}>{contact}</Link>. ISA grants partner licences case by case.
        </P>
      </Section>

      <Section id="contributor-agreement" title="Contributor agreement (version 2026-11)">
        <P>
          This agreement covers everything you have added to SlackMap and everything you will add:
          lines, spots, guides, groups, photos, texts and corrections ("your contributions").
        </P>
        <ul>
          <li>
            <Typography variant="body2">
              You keep ownership of your contributions. You give ISA a worldwide, permanent,
              irrevocable, royalty-free, non-exclusive licence to use, copy, edit, combine, publish and
              make them available as part of SlackMap and its map data, and to license them to
              partners.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              You authorise ISA to act in its own name against unauthorised copying of the map data
              that includes your contributions.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              You confirm that your contributions are yours to share, that people shown in your photos
              agree to them being published, and that, as far as you know, the information is accurate.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Your contributions are shown with your name, as today. You can remove your content from
              the map at any time, or ask us to.
            </Typography>
          </li>
        </ul>
      </Section>

      <Section id="privacy" title="Privacy">
        <ul>
          <li>
            <Typography variant="body2">
              <b>What we process:</b> technical data from your browser (IP address, browser type,
              country, network), a cookie the map needs to work, your ISA ID if you are signed in, and
              whether you accepted the contributor agreement. Our logs do not keep your IP address.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <b>Why:</b> to run SlackMap, keep it secure and protect its data from automated copying
              (our legitimate interest).
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <b>Who helps us:</b> Amazon Web Services (hosting, Frankfurt, Germany) and Cloudflare (the
              check that tells people from bots, under its{' '}
              <Link href="https://www.cloudflare.com/turnstile-privacy-policy/">Turnstile privacy addendum</Link>).
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <b>How long:</b> technical logs up to 6 months; the agreement record as long as your
              contributions are on SlackMap.
            </Typography>
          </li>
        </ul>
        <P>
          Questions or requests about your data: <Link href={`mailto:${contact}`}>{contact}</Link>.
        </P>
      </Section>

      <Section title="Safety and liability">
        <P>
          The map data comes from the community and may be wrong, outdated or incomplete. Slacklining
          and highlining are dangerous: check every anchor, line and access rule yourself, on site.
          ISA runs SlackMap as a volunteer, non-profit service and provides it as it is. As far as the
          law allows, ISA is not liable for losses from using SlackMap or from it being unavailable;
          liability for intent and gross negligence remains.
        </P>
      </Section>

      <Section title="Changes and law">
        <P>
          We may update these terms; the date above shows the current version. Swiss law applies; the
          courts of Bern, Switzerland, have jurisdiction, unless the law of your country gives you other
          rights as a consumer.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          <Link href={`mailto:${contact}`}>{contact}</Link>
        </P>
      </Section>
    </Box>
  </Box>
);
