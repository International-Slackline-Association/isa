import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { ddb } from '../../aws/clients';
import { logger } from '../../logger';
import { dataUrl, webDomain } from '../../domain';

const tableName = process.env.SLACKMAP_SESSIONS_TABLE_NAME as string;
const sessionSeconds = 12 * 60 * 60;
// The busiest real visitor made 103 API calls in a day and 25 in a minute.
const callsPerSession = 600;
// Generous, because mobile networks put many people behind one IP.
const sessionsPerNetworkPerHour = 20;
// A session also opens the API, so a partner cannot take sessions without end to sweep it.
const sessionsPerAppPerDay = 24;
const cookieNames = ['CloudFront-Policy', 'CloudFront-Signature', 'CloudFront-Key-Pair-Id'] as const;

const privateKey = () => createPrivateKey(process.env.SESSION_SIGNING_KEY!);
// The key CloudFront trusts, so a mismatch with the signing key shows here before enforcement.
let publicKey: ReturnType<typeof createPublicKey> | undefined;

// CloudFront's URL-safe base64.
const encode = (data: Buffer) =>
  data.toString('base64').replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
const decode = (text: string) =>
  Buffer.from(text.replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/'), 'base64');

const hash = (...parts: string[]) => createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);

const count = async (key: string, expiresAt: number) => {
  const result = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { PK: key },
      UpdateExpression: 'ADD calls :one SET ddb_ttl = if_not_exists(ddb_ttl, :ttl)',
      ExpressionAttributeValues: { ':one': 1, ':ttl': expiresAt },
      ReturnValues: 'UPDATED_NEW',
    }),
  );
  return result.Attributes?.calls as number;
};

const viewerIp = (headers: Record<string, string | undefined>) => {
  const address = headers['cloudfront-viewer-address'];
  if (!address) return undefined;
  return address.slice(0, address.lastIndexOf(':')).replace(/^\[|\]$/g, '');
};
// One IPv6 network hands out a new address per request, so it counts by its /64.
const network = (ip: string) => (ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip);

const verifyTurnstile = async (token: string, ip: string | undefined) => {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET!,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
    signal: AbortSignal.timeout(5000),
  });
  const result = (await response.json()) as {
    success: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };
  const hostname = result.hostname ?? '';
  const passed = result.success && (hostname === webDomain || hostname.endsWith(`.${webDomain}`));
  if (!passed) logger.warn('Browser check failed', { errorCodes: result['error-codes'], hostname });
  return passed;
};

// The same cookies a browser gets, which data. checks by their signature alone.
const signedCookies = (now: number) => {
  const expiresAt = now + sessionSeconds;
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: `${dataUrl}/*`,
        Condition: { DateLessThan: { 'AWS:EpochTime': expiresAt } },
      },
    ],
  });
  const values = {
    'CloudFront-Policy': encode(Buffer.from(policy)),
    'CloudFront-Signature': encode(sign('RSA-SHA1', Buffer.from(policy), privateKey())),
    'CloudFront-Key-Pair-Id': process.env.SESSION_KEY_PAIR_ID!,
  };
  const cookies = cookieNames.map(
    (name) =>
      `${name}=${values[name]}; Domain=${webDomain}; Path=/; Max-Age=${sessionSeconds}; Secure; HttpOnly; SameSite=Lax`,
  );
  return { cookies, values, expiresAt };
};

// A partner app, already let in by its scope: no browser check and no per-network limit.
export const issueAppSession = async (clientId: string) => {
  const now = Math.floor(Date.now() / 1000);
  const day = Math.floor(now / 86400);
  if ((await count(`app:${clientId}:${day}`, (day + 2) * 86400)) > sessionsPerAppPerDay) {
    throw new Error('TooManyRequests: Too many sessions for this app today');
  }
  return signedCookies(now);
};

export const issueSession = async (token: unknown, headers: Record<string, string | undefined>) => {
  const ip = viewerIp(headers);
  const now = Math.floor(Date.now() / 1000);
  // Local dev, through its proxy, holds the origin secret instead of passing the check.
  const isDev = Boolean(headers['x-dev-key']) && headers['x-dev-key'] === process.env.ORIGIN_SECRET;
  if (!isDev) {
    if (typeof token !== 'string' || !token) throw new Error('Validation: token is required');
    if (!(await verifyTurnstile(token, ip))) throw new Error('Forbidden: Browser check failed');
  }
  if (ip && !isDev) {
    const hour = Math.floor(now / 3600);
    // Only sessions that passed count, so junk requests cannot lock out a shared network.
    const key = `issue:${hash(process.env.ORIGIN_SECRET!, String(hour), network(ip))}:${hour}`;
    if ((await count(key, (hour + 2) * 3600)) > sessionsPerNetworkPerHour) {
      throw new Error('TooManyRequests: Too many sessions from this network');
    }
  }

  return signedCookies(now);
};

const parseCookies = (header: string | undefined) =>
  Object.fromEntries(
    (header ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name]) => name)
      .map(([name, ...rest]) => [name, rest.join('=')]),
  );

export type SessionState = 'valid' | 'absent' | 'invalid' | 'expired' | 'overLimit';

export const checkSession = async (headers: Record<string, string | undefined>): Promise<SessionState> => {
  const cookies = parseCookies(headers['cookie']);
  const policyText = cookies['CloudFront-Policy'];
  const signature = cookies['CloudFront-Signature'];
  if (!policyText || !signature) return 'absent';

  const policy = decode(policyText);
  publicKey ??= createPublicKey(process.env.SESSION_PUBLIC_KEY!);
  if (!verify('RSA-SHA1', policy, publicKey, decode(signature))) return 'invalid';
  let expiresAt: number;
  try {
    expiresAt = JSON.parse(policy.toString()).Statement[0].Condition.DateLessThan['AWS:EpochTime'];
  } catch {
    return 'invalid';
  }
  if (!(expiresAt > Date.now() / 1000)) return 'expired';

  const calls = await count(`session:${hash(signature)}`, expiresAt);
  return calls > callsPerSession ? 'overLimit' : 'valid';
};
