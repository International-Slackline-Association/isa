import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const contact = 'slackmap@slacklineinternational.org';
const requestForm = 'https://data.slacklineinternational.org/access/slackmap.com-api-request/';

const Section = (props: { id?: string; title: string; children: React.ReactNode }) => (
  <Box component="section" id={props.id} sx={{ marginTop: 3 }}>
    <Typography variant="h6" component="h3" gutterBottom>
      {props.title}
    </Typography>
    {props.children}
  </Box>
);

const Part = (props: { id: string; title: string }) => (
  <Box id={props.id} sx={{ marginTop: 5 }}>
    <Divider sx={{ marginBottom: 3 }} />
    <Typography variant="h5" component="h2">
      {props.title}
    </Typography>
  </Box>
);

const P = (props: { children: React.ReactNode }) => (
  <Typography variant="body2" component="p" sx={{ marginBottom: 1.5 }}>
    {props.children}
  </Typography>
);

const Item = (props: { children: React.ReactNode }) => (
  <li>
    <Typography variant="body2">{props.children}</Typography>
  </li>
);

const Code = (props: { children: string }) => (
  <Paper variant="outlined" sx={{ padding: 1.5, marginBottom: 1.5, overflowX: 'auto' }}>
    <Typography variant="body2" component="pre" sx={{ margin: 0, fontFamily: 'monospace' }}>
      {props.children}
    </Typography>
  </Paper>
);

const files: [string, string][] = [
  ['lines/all.geojson', 'Every line, with its shape.'],
  ['spots/all.geojson', 'Every spot, with its area.'],
  ['guides/all.geojson', 'Every access guide, with its shapes.'],
  ['lines/points.geojson, spots/points.geojson, guides/points.geojson', 'The same items as one point each.'],
  ['active.geojson', 'Only the lines and spots that are rigged right now.'],
];

const fullFields: [string, string][] = [
  ['id', "The item's id."],
  ['ft', 'What it is: l for a line, s for a spot, g for an access guide.'],
  ['l', "On a line, its length, such as 45.0m. On a guide, its kind."],
  ['lt', "A line's type by first letter: h highline, w waterline, m midline, l longline, t trickline, r rodeoline, p parkline. Missing for other types."],
  ['st', "A spot's types by first letter: h highline, w waterline, p park."],
  ['c', 'Two-letter country code (ISO 3166-1).'],
  ['au, aa', 'Only while it is rigged: active until and activated at, in Unix seconds.'],
];

const activeFields: [string, string][] = [
  ['id', "The line's or spot's id."],
  ['type', 'line or spot.'],
  ['name', 'Its name, or null.'],
  ['lineType', "A line's type, such as highline; null for a spot."],
  ['length, height', "A line's metres, or null."],
  ['country', 'Two-letter country code (ISO 3166-1).'],
  ['activeFrom, activeUntil', 'When it is rigged, as ISO times.'],
  ['activatedAt', 'When it was activated, to the hour.'],
  ['anonymous', 'true when it was activated anonymously. Who activated it is never included.'],
  ['url', 'Its page on SlackMap.'],
];

const Rows = (props: { head: [string, string]; rows: [string, string][] }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ marginBottom: 1.5 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{props.head[0]}</TableCell>
          <TableCell>{props.head[1]}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.rows.map(([name, meaning]) => (
          <TableRow key={name}>
            <TableCell sx={{ fontFamily: 'monospace' }}>{name}</TableCell>
            <TableCell>{meaning}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const PartnersPage = () => (
  <Box sx={{ height: '100vh', overflowY: 'auto', width: '100%' }}>
    <Box sx={{ maxWidth: 720, margin: '0 auto', padding: { xs: '24px 16px 88px', lg: '32px 24px' } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Access to SlackMap API data
      </Typography>

      <P>
        Are you building an app, a federation or club map, a local guide or a research project, or does
        your organisation need to know where slacklines are? SlackMap's data is available through an
        API.
      </P>
      <Alert severity="info" sx={{ marginBottom: 1.5 }}>
        Only ISA members and ISA partners can request API access. Becoming one is the first step.
      </Alert>
      <P>
        This page has two parts: <Link href="#api-access">how API access works</Link>, for everyone,
        and the <Link href="#technical">technical guide</Link>, for the developer who connects your
        application.
      </P>

      <Part id="api-access" title="Part 1: How API access works" />

      <Section id="who" title="Who can request access">
        <P>Only organisations that are part of ISA:</P>
        <ul>
          <Item>
            <b>ISA members:</b> non-profit federations, associations and clubs.{' '}
            <Link href="https://www.slacklineinternational.org/join-isa/">Become an ISA member</Link>.
          </Item>
          <Item>
            <b>ISA partners:</b> commercial entities.{' '}
            <Link href="https://www.slacklineinternational.org/partners/">Become an ISA partner</Link>.
          </Item>
        </ul>
        <P>If your organisation is neither yet, join first. Then send your request.</P>
      </Section>

      <Section title="How to get access">
        <ol>
          <Item>
            <b>Be an ISA member or ISA partner.</b> This is required; see{' '}
            <Link href="#who">who can request access</Link>.
          </Item>
          <Item>
            <b>Fill out the request form.</b> It asks for the points listed below.
            <Box sx={{ marginY: 1 }}>
              <Button variant="contained" href={requestForm} target="_blank" rel="noopener">
                Open the request form
              </Button>
            </Box>
          </Item>
          <Item>
            <b>We review your request.</b> ISA looks at every request case by case and may come back
            with questions.
          </Item>
          <Item>
            <b>Access can be granted.</b>
          </Item>
          <Item>
            <b>You receive credentials.</b> A client ID and a client secret for your application.
          </Item>
          <Item>
            <b>Your developer connects your application</b>, following the{' '}
            <Link href="#technical">technical guide</Link>.
          </Item>
          <Item>
            <b>We monitor your data use</b> after your application is connected, for changes.
          </Item>
        </ol>
      </Section>

      <Section id="request" title="What the request form asks">
        <ul>
          <Item>Who you are: your organisation, a contact person and a backup contact.</Item>
          <Item>What you are building with the SlackMap data, and who will use it.</Item>
          <Item>Why you need the data: the purpose it serves.</Item>
          <Item>
            Which data you need: all lines, spots and guides, or only the lines rigged right now, and
            for which countries.
          </Item>
          <Item>How you will use and show the data, and whether you pass it on to anyone.</Item>
          <Item>How often you expect to fetch it.</Item>
        </ul>
      </Section>

      <Section title="What you get">
        <P>
          The same data the map on slackmap.com shows: every line, spot and access guide, and a
          separate list of the lines and spots that are rigged right now (the activity feature).
        </P>
      </Section>

      <Section id="rules" title="Rules for API usage">
        <ul>
          <Item>
            <b>Fetch only as often as you need.</b> The list of rigged lines about once an hour, and
            everything else a few times a day at most. That is enough to stay up to date.
          </Item>
          <Item>
            <b>Lines, spots and guides only.</b> The community groups are not part of API access.
          </Item>
          <Item>
            <b>Name your application</b> in every request, so we can tell your requests apart.
          </Item>
          <Item>
            <b>Know the limits of the data.</b> Slackliners report rigged lines themselves and are free
            not to: a line that is not on the list may still be rigged. The{' '}
            <Link href="/terms">terms of use</Link> say more.
          </Item>
        </ul>
      </Section>

      <Section id="ending-access" title="We can restrict or end your access">
        <P>
          API access is not an entitlement. We can restrict the access of an application that does
          not keep to the rules above. We also reserve the right to end access at any time.
        </P>
      </Section>

      <Section title="Questions">
        <P>
          <Link href={`mailto:${contact}`}>{contact}</Link>
        </P>
      </Section>

      <Part id="technical" title="Part 2: Technical guide" />

      <Section title="The files">
        <P>
          GeoJSON files on <code>https://data.slackmap.com/geojson/</code>:
        </P>
        <Rows head={['File', 'Contents']} rows={files} />
        <P>
          API access covers these files only. The community groups are not part of it.
        </P>
        <P>
          The files of lines, spots and guides use short field names:
        </P>
        <Rows head={['Field', 'Meaning']} rows={fullFields} />
      </Section>

      <Section id="fetching" title="Fetching a file">
        <P>
          Your application signs in with its credentials, opens a session, and then downloads the files
          with that session. Keep the client secret on your server; never put it in a browser or a
          mobile app.
        </P>

        <P>
          <b>1. Get a token</b> with your client ID and secret:
        </P>
        <Code>
          {`curl -u "$CLIENT_ID:$CLIENT_SECRET" \\
  -d "grant_type=client_credentials&scope=slackmap/data.read" \\
  https://auth.slacklineinternational.org/oauth2/token`}
        </Code>
        <P>
          The answer holds an <code>access_token</code>.
        </P>

        <P>
          <b>2. Open a session</b> with the token, sending your application's name as the{' '}
          <code>User-Agent</code>:
        </P>
        <Code>
          {`curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -A "your-application-name" \\
  https://api.slackmap.com/v1/session`}
        </Code>
        <P>
          The answer holds <code>cookieHeader</code> and <code>expiresAt</code>, the time the session
          ends in Unix seconds. A session lasts 12 hours, and an application can open at most 24
          sessions a day, so reuse a session until it expires.
        </P>

        <P>
          <b>3. Download a file</b>, sending <code>cookieHeader</code> as the <code>Cookie</code> header
          and the same <code>User-Agent</code>:
        </P>
        <Code>
          {`curl --compressed -H "Cookie: $COOKIE_HEADER" \\
  -A "your-application-name" \\
  https://data.slackmap.com/geojson/active.geojson`}
        </Code>
      </Section>

      <Section id="active" title="The file of rigged lines and spots">
        <P>
          <code>active.geojson</code> is a GeoJSON <code>FeatureCollection</code>. Each feature's
          geometry is the line, or the spot's area. The file is rewritten whenever an activation
          changes, and every hour. Stop showing a feature once its <code>activeUntil</code> has passed.
        </P>
        <Rows head={['Field', 'Meaning']} rows={activeFields} />
      </Section>
    </Box>
  </Box>
);
