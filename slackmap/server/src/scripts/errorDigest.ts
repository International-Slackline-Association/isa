import { createHash } from 'crypto';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  GetQueryResultsCommand,
  StartQueryCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { logger } from '../core/logger';

logger.setLambdaName('errorDigest');

const logsClient = new CloudWatchLogsClient({});
const project = 'slackmap';
const repo = process.env.GITHUB_REPOSITORY ?? 'International-Slackline-Association/isa';
const label = `errors:${project}`;
const token = process.env.GITHUB_TOKEN;
const logGroupPrefix = `${project}-prod-app-`;

const quietWeeksBeforeClose = 4;
const maxNewIssuesPerRun = 10;

const query = `fields @log, message, coalesce(data.data.err, data.error, data.message) as detail,
  data.route as route, coalesce(data.stack, data.data.stack) as errStack
| parse @message /Invoke Error \\t\\{"errorType":"(?<errorType>[^"]+)","errorMessage":"(?<errorMessage>[^"]{0,300})/
| parse @message /(?<runtime>Task timed out after|Status: timeout|Error Type: Runtime\\.[A-Za-z]+)/
| filter level = "error" or ispresent(errorType) or ispresent(runtime)
| stats count(*) as count, min(@timestamp) as firstSeen, max(@timestamp) as lastSeen, latest(errStack) as stack
    by @log, message, detail, route, errorType, errorMessage, runtime
| limit 10000`;

type Row = Record<string, string | undefined>;
type ErrorGroup = {
  fingerprint: string;
  lambda: string;
  logGroup: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  routes: Set<string>;
  stack?: string;
};
type Issue = {
  number: number;
  state: 'open' | 'closed';
  state_reason?: string | null;
  body?: string | null;
  pull_request?: unknown;
};

// Issues are public: the message is reduced to its shape, so ids, values and secrets never reach them.
const normalise = (text: string) =>
  text
    .split('\n')[0]
    .replace(/(["'`])(?:(?!\1).)*\1/g, '"<str>"')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>')
    .replace(/arn:aws[\w-]*:\S+/g, '<arn>')
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/ISA_[A-Z0-9]+/g, '<isaId>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?/g, '<date>')
    .replace(/\b[0-9a-f]{8,}\b/gi, '<id>')
    .replace(/[A-Za-z0-9_-]{6,}/g, (t) => (/\d/.test(t) && /[A-Za-z]/.test(t) ? '<id>' : t))
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

const trimStack = (stack?: string) =>
  stack
    ?.split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('at ') && !l.includes('node:internal') && !l.includes('node_modules'))
    .map((l) => l.replace(/\(?\/?[^ (]*?\/src\//, '(src/'))
    .slice(0, 8)
    .join('\n');

const isoWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

// The week before the current Monday 00:00 UTC; a retry scans the same window.
const lastWeekWindow = () => {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
  const start = new Date(end.getTime() - 7 * 86400000);
  return { start, end, week: isoWeek(start) };
};

const weeksBetween = (fromWeek: string, toWeek: string) => {
  const toDate = (w: string) => {
    const [year, week] = w.split('-W').map(Number);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    return jan4.getTime() + ((week - 1) * 7 - ((jan4.getUTCDay() + 6) % 7)) * 86400000;
  };
  return Math.round((toDate(toWeek) - toDate(fromWeek)) / (7 * 86400000));
};

const runQuery = async (start: Date, end: Date) => {
  const groups = await logsClient.send(
    new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupPrefix }),
  );
  const logGroupNames = (groups.logGroups ?? []).map((g) => g.logGroupName!);
  const { queryId } = await logsClient.send(
    new StartQueryCommand({
      logGroupNames,
      startTime: Math.floor(start.getTime() / 1000),
      endTime: Math.floor(end.getTime() / 1000),
      queryString: query,
    }),
  );
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const result = await logsClient.send(new GetQueryResultsCommand({ queryId }));
    if (result.status === 'Complete') {
      return (result.results ?? []).map(
        (fields) => Object.fromEntries(fields.map((f) => [f.field!, f.value])) as Row,
      );
    }
    if (result.status !== 'Running' && result.status !== 'Scheduled') {
      throw new Error(`Logs Insights query ended as ${result.status}`);
    }
  }
  throw new Error('Logs Insights query did not finish in time');
};

const lambdaOfLogGroup = (logGroup: string) =>
  logGroup.slice(logGroupPrefix.length).replace(/FunctionLogs.*$/, '');

const groupErrors = (rows: Row[]) => {
  const groups = new Map<string, ErrorGroup>();
  for (const row of rows) {
    const logGroup = (row['@log'] ?? '').split(':').pop() ?? '';
    const lambda = lambdaOfLogGroup(logGroup);
    // Our own error line first: its stack can mention the runtime, which is not a crash.
    const raw = row.message
      ? `${row.message}${row.detail ? `: ${row.detail}` : ''}`
      : row.errorType
        ? `${row.errorType}: ${row.errorMessage ?? ''}`
        : row.runtime?.startsWith('Error Type: ')
          ? `Lambda crashed: ${row.runtime.slice('Error Type: '.length)}`
          : // One timeout can log both forms.
            'Lambda timed out';
    const message = normalise(raw);
    const fingerprint = createHash('sha256').update(`${lambda}\n${message}`).digest('hex').slice(0, 12);
    const group = groups.get(fingerprint) ?? {
      fingerprint,
      lambda,
      logGroup,
      message,
      count: 0,
      firstSeen: row.firstSeen!,
      lastSeen: row.lastSeen!,
      routes: new Set<string>(),
    };
    group.count += Number(row.count ?? 0);
    if (row.firstSeen! < group.firstSeen) group.firstSeen = row.firstSeen!;
    if (row.lastSeen! >= group.lastSeen) {
      group.lastSeen = row.lastSeen!;
      group.stack = trimStack(row.stack) || group.stack;
    }
    if (row.route) group.routes.add(row.route);
    groups.set(fingerprint, group);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
};

const github = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': `${project}-error-digest`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`GitHub ${method} ${path} failed with ${response.status}`);
  }
  return { data: await response.json(), link: response.headers.get('link') };
};

const listIssues = async () => {
  const issues: Issue[] = [];
  let path: string | undefined =
    `/repos/${repo}/issues?labels=${encodeURIComponent(label)}&state=all&per_page=100`;
  while (path) {
    const page: { data: Issue[]; link: string | null } = await github('GET', path);
    issues.push(...page.data.filter((i) => !i.pull_request));
    const next = page.link?.match(/<https:\/\/api\.github\.com([^>]+)>; rel="next"/)?.[1];
    path = next;
  }
  return issues;
};

const markerOf = (body?: string | null) => {
  const m = body?.match(/<!-- error-digest fp=(\w+) seen=([\w-]+) -->/);
  return m ? { fingerprint: m[1], seen: m[2] } : undefined;
};
const withSeen = (body: string, week: string) =>
  body.replace(/(<!-- error-digest fp=\w+ seen=)[\w-]+( -->)/, `$1${week}$2`);

const digInQuery = (group: ErrorGroup) => {
  const literal = group.message
    .split(/<\w+>|"/)
    .map((s) => s.trim())
    .sort((a, b) => b.length - a.length)[0];
  return `fields @timestamp, @message | filter @message like ${JSON.stringify(literal ?? '')} | sort @timestamp desc | limit 20`;
};

const weekLine = (group: ErrorGroup, week: string) =>
  `${week}: ${group.count}×, last seen ${group.lastSeen}${
    group.routes.size ? `, routes ${[...group.routes].join(', ')}` : ''
  }`;

const issueBody = (group: ErrorGroup, week: string) =>
  [
    `**Lambda:** ${group.lambda}`,
    group.routes.size ? `**Routes:** ${[...group.routes].map((r) => `\`${r}\``).join(', ')}` : '',
    `**Message:** \`${group.message}\``,
    `**First seen:** ${group.firstSeen}`,
    `**${weekLine(group, week)}**`,
    group.stack ? `\n\`\`\`\n${group.stack}\n\`\`\`` : '',
    `\nDig in with Logs Insights on the log group \`${group.logGroup}\`:\n\`\`\`\n${digInQuery(group)}\n\`\`\``,
    `\nWritten by the weekly error digest; keep the marker line below.`,
    `<!-- error-digest fp=${group.fingerprint} seen=${week} -->`,
  ]
    .filter(Boolean)
    .join('\n');

// 'days' scans up to now instead of last week, to try the digest out.
const main = async (event: { live?: boolean; days?: number } = {}) => {
  // A try-out window would stamp this week as seen and hide it from the real Monday run.
  const live = event.live === true && !event.days;
  const { start, end, week } = event.days
    ? {
        start: new Date(Date.now() - event.days * 86400000),
        end: new Date(),
        week: isoWeek(new Date()),
      }
    : lastWeekWindow();
  const groups = groupErrors(await runQuery(start, end));
  const issues = await listIssues();
  const byFingerprint = new Map<string, Issue>();
  for (const issue of issues) {
    const marker = markerOf(issue.body);
    if (marker) byFingerprint.set(marker.fingerprint, issue);
  }

  const act = async (action: string, details: Record<string, unknown>, run: () => Promise<unknown>) => {
    logger.info(live ? action : `dry run: ${action}`, details);
    if (live) await run();
  };

  let created = 0;
  const seen = new Set<string>();
  for (const group of groups) {
    seen.add(group.fingerprint);
    const issue = byFingerprint.get(group.fingerprint);
    if (!issue) {
      if (created >= maxNewIssuesPerRun) {
        logger.info('new issue left for next week', { fingerprint: group.fingerprint });
        continue;
      }
      created++;
      const title = `${project} ${group.lambda}: ${group.message}`.slice(0, 100);
      const body = issueBody(group, week);
      await act('create issue', { title, body }, () =>
        github('POST', `/repos/${repo}/issues`, { title, body, labels: [label] }),
      );
      continue;
    }
    if (markerOf(issue.body)?.seen === week) continue;
    const body = withSeen(issue.body ?? '', week);
    if (issue.state === 'open') {
      await act('comment issue', { number: issue.number, comment: weekLine(group, week) }, async () => {
        await github('PATCH', `/repos/${repo}/issues/${issue.number}`, { body });
        await github('POST', `/repos/${repo}/issues/${issue.number}/comments`, {
          body: weekLine(group, week),
        });
      });
    } else if (issue.state_reason === 'completed') {
      const comment = `Came back. ${weekLine(group, week)}`;
      await act('reopen issue', { number: issue.number, comment }, async () => {
        await github('PATCH', `/repos/${repo}/issues/${issue.number}`, {
          state: 'open',
          state_reason: 'reopened',
          body,
        });
        await github('POST', `/repos/${repo}/issues/${issue.number}/comments`, { body: comment });
      });
    }
  }

  for (const issue of issues) {
    const marker = markerOf(issue.body);
    if (issue.state !== 'open' || !marker || seen.has(marker.fingerprint)) continue;
    if (weeksBetween(marker.seen, week) < quietWeeksBeforeClose) continue;
    const comment = `Not seen since ${marker.seen}, closing.`;
    await act('close issue', { number: issue.number, comment }, async () => {
      await github('PATCH', `/repos/${repo}/issues/${issue.number}`, {
        state: 'closed',
        state_reason: 'completed',
      });
      await github('POST', `/repos/${repo}/issues/${issue.number}/comments`, { body: comment });
    });
  }

  logger.info('error digest done', { live, week, errors: groups.length, issues: issues.length });
  return { week, errors: groups.length };
};

const args = process.argv.slice(2);
const daysIndex = args.indexOf('--days');
main({
  live: args.includes('--live'),
  days: daysIndex >= 0 ? Number(args[daysIndex + 1]) : undefined,
}).catch((err) => {
  logger.error('error digest failed', { message: (err as Error).message });
  process.exit(1);
});
