import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from '@mui/material';

import { appColors } from 'styles/theme/colors';

const contact = 'slackmap@slacklineinternational.org';

const sections: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: 'About SlackMap',
    items: [
      {
        q: 'What is SlackMap?',
        a: 'A free world map of slacklines, spots and access guides, documented by slackliners and run by the International Slackline Association (ISA).',
      },
      {
        q: 'What is the difference between a line, a spot and an access guide?',
        a: (
          <>
            <b style={{ color: appColors.lineStrokeColor }}>Lines</b> are single slacklines.{' '}
            <b style={{ color: appColors.spotFillColor }}>Spots</b> are areas with several lines.{' '}
            <b style={{ color: appColors.guideFeaturesColor }}>Access guides</b> tell you about access: parking, paths
            and restricted areas.
          </>
        ),
      },
      {
        q: 'Who is behind SlackMap?',
        a: (
          <>
            Piotr Błaszczak started SlackMap in Poland. When maintaining it became too much, ISA took
            it over, and Can Sahin rebuilt it from scratch with simplicity first, so it stays easy to
            maintain. The groups data comes from Kimberly Weglin, Ryan Jenks and Grant Mercier. Today
            the ISA Nature and Access Commission decides on features and access conflicts; ISA funds
            it and volunteers from the community build it.
          </>
        ),
      },
    ],
  },
  {
    title: 'Adding and editing',
    items: [
      {
        q: 'How do I sign in?',
        a: (
          <>
            With your ISA Account. No account yet? Create one at{' '}
            <Link href="https://account.slacklineinternational.org" target="_blank" rel="noreferrer">
              account.slacklineinternational.org
            </Link>
            .
          </>
        ),
      },
      {
        q: 'How do I add a line, spot or access guide?',
        a: 'Sign in, then tap the + button at the bottom right of the map and pick what you want to add.',
      },
      {
        q: 'How do I change or delete one?',
        a: 'Open it and use the menu in its corner: "Edit" or "Request to Edit", and "Delete". If it is not yours, the owner gets your request and decides.',
      },
      {
        q: 'How do I add or update a slackline group?',
        a: 'On the Communities map, tap + to add a group; to change one, open it and use "Request to Edit". Groups recognised by ISA are managed by ISA.',
      },
      {
        q: 'What happens to what I add?',
        a: (
          <>
            It stays yours. You give ISA a licence to show it and protect it from copying, as the{' '}
            <Link href="/terms#contributor-agreement">contributor agreement</Link> says.
          </>
        ),
      },
      {
        q: 'Can I get a copy of what I added?',
        a: (
          <>
            Yes, write to <Link href={`mailto:${contact}`}>{contact}</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: 'Data and privacy',
    items: [
      {
        q: 'Can I use SlackMap data in my app or website?',
        a: (
          <>
            Not without permission. Browsing, planning and sharing links are free; for anything else,
            ask us at <Link href={`mailto:${contact}`}>{contact}</Link> for a partner licence. See the{' '}
            <Link href="/terms">terms of use</Link>.
          </>
        ),
      },
      {
        q: 'How is reporting a line rigged anonymous?',
        a: (
          <>
            While you are signed in, your browser gets a few anonymous passes from SlackMap. They are
            blind-signed (the open standard{' '}
            <Link href="https://www.rfc-editor.org/rfc/rfc9474" target="_blank" rel="noreferrer">
              RFC 9474
            </Link>
            ): we sign them without seeing them, so we can later tell a pass is real but not whose it
            was. A report carries one pass and never your account, so we learn only that a member sent
            it. It gives you a manage link instead of tying the rig to you: whoever has the link can
            extend it or take it down. The code is open source, so anyone can check this.
          </>
        ),
      },
      {
        q: 'Why do I sometimes see "Verify you are human"?',
        a: 'SlackMap is free for people, not for automated copying, so we check that a real browser is loading the map. Most visitors never see it.',
      },
    ],
  },
  {
    title: 'Help',
    items: [
      {
        q: 'I am a developer or designer. How can I help?',
        a: (
          <>
            SlackMap is open source:{' '}
            <Link
              href="https://github.com/International-Slackline-Association/isa"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
            , or write to <Link href={`mailto:${contact}`}>{contact}</Link>.
          </>
        ),
      },
    ],
  },
];

export const FAQ = () => (
  <Box sx={{ minWidth: { sm: 420 } }}>
    {sections.map((section) => (
      <Box key={section.title} sx={{ marginBottom: 2 }}>
        <Typography
          variant="overline"
          component="h3"
          sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}
        >
          {section.title}
        </Typography>
        {section.items.map((item) => (
          <Accordion
            key={item.q}
            disableGutters
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              marginBottom: 1,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" component="div" color="text.secondary">
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    ))}
  </Box>
);
