import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { SessionState, checkSession } from '../core/features/session';
import { logger } from '../core/logger';
import { generateISAIdFromUsername } from '../core/utils';
import { parseExpectedError } from '../core/utils/error';
import { webDomain, webUrl } from '../core/domain';

export type User = {
  isaId?: string;
  sub?: string;
  email?: string;
};

export type Request<Params extends Record<string, string> = Record<string, string>> = {
  method: string;
  path: string;
  params: Params;
  headers: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body: any;
  user?: User;
};

export type Route = (request: Request<any>) => Promise<APIGatewayProxyResult>;

export const json = (data: unknown, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
});

const webOrigins = (process.env.WEB_ORIGINS ?? '').split(',');
const enforced = process.env.DATA_ACCESS_ENFORCED === 'true';
const termsLink = `<${webUrl}/terms>; rel="terms-of-service"`;

// The web app sends its session cookie, so only its own origins are allowed, by name.
const responseHeaders = (origin: string | undefined) => ({
  Link: termsLink,
  Vary: 'Origin',
  ...(origin && webOrigins.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }
    : {}),
});

// Pages are what link previews and search engines read; the session endpoint is how a browser gets in.
const isOpenPath = (method: string, path: string) =>
  path.toLowerCase().startsWith('/page/') || (method === 'POST' && path.toLowerCase() === '/session');

const maxBodyBytes = 3 * 1024 * 1024;

const parseBody = (event: APIGatewayProxyEvent) => {
  const contentType = Object.entries(event.headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'content-type',
  )?.[1];
  if (!contentType?.toLowerCase().startsWith('application/json') || !event.body) return {};

  const text = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
  if (Buffer.byteLength(text) > maxBodyBytes) throw new Error('request entity too large');
  const body = JSON.parse(text);
  if (typeof body !== 'object' || body === null) {
    throw new SyntaxError('Request body must be a JSON object or array');
  }
  return body;
};

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.ISA_USER_POOL_ID!,
  clientId: process.env.SLACKMAP_CLIENT_ID!,
  tokenUse: 'id',
});

// The API has no authorizer: a token that fails verification counts as no user.
const getUser = async (headers: Record<string, string | undefined>): Promise<User | undefined> => {
  const token = headers['authorization']?.split(' ')[1];
  if (!token) return undefined;
  const claims = await verifier.verify(token).catch((error: Error) => {
    logger.warn('Token rejected', { reason: error.message });
    return undefined;
  });
  if (!claims) return undefined;
  return {
    isaId: generateISAIdFromUsername(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : undefined,
    sub: claims.sub,
  };
};

// Routes are keyed 'METHOD /path/:param'. Like Express: case-insensitive, one trailing slash allowed,
// HEAD answered by the GET route, the first registered route that matches wins.
const compileRoutes = (routes: Record<string, Route>) =>
  Object.entries(routes).map(([key, route]) => {
    const [method, path] = key.split(' ');
    return { key, method, segments: path.split('/').slice(1), route };
  });

const matchRoute = (
  compiled: ReturnType<typeof compileRoutes>,
  method: string,
  path: string,
): { key: string; route: Route; params: Record<string, string> } | undefined => {
  const routeMethod = method === 'HEAD' ? 'GET' : method;
  const pathSegments = path.replace(/\/$/, '').split('/').slice(1);
  for (const candidate of compiled) {
    if (candidate.method !== routeMethod || candidate.segments.length !== pathSegments.length) {
      continue;
    }
    const params: Record<string, string> = {};
    const matches = candidate.segments.every((segment, i) => {
      if (segment.startsWith(':')) {
        if (!pathSegments[i]) return false;
        params[segment.slice(1)] = pathSegments[i];
        return true;
      }
      return segment.toLowerCase() === pathSegments[i].toLowerCase();
    });
    if (matches) {
      for (const name of Object.keys(params)) params[name] = decodeURIComponent(params[name]);
      return { key: candidate.key, route: candidate.route, params };
    }
  }
  return undefined;
};

// Only the origin: a full referer can carry a path or query with personal data.
const refererOrigin = (referer?: string) => {
  try {
    return referer ? new URL(referer).origin : undefined;
  } catch {
    return undefined;
  }
};

export const createHandler = (
  lambdaName: string,
  routes: Record<string, Route>,
  anonymousRoutes: Record<string, Route> = {},
) => {
  logger.setLambdaName(lambdaName);
  const compiled = compileRoutes({ ...routes, ...anonymousRoutes });
  const anonymousKeys = new Set(Object.keys(anonymousRoutes));

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const start = Date.now();
    const method = event.httpMethod.toUpperCase();
    const path = `/${event.pathParameters?.proxy ?? ''}`;
    const query = event.queryStringParameters ?? {};
    const headers = Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
    );
    let user: User | undefined;
    let routeKey: string | undefined;
    // Only CloudFront knows the secret; a call straight to execute-api does not have it.
    const viaCloudFront = headers['x-origin-secret'] === process.env.ORIGIN_SECRET;
    let session: SessionState | undefined;
    // Known before anything can fail, so an anonymous call is never logged with the browser's fingerprint.
    const match = matchRoute(compiled, method, path);
    const anonymous = Boolean(match && anonymousKeys.has(match.key));

    const respond = async (): Promise<APIGatewayProxyResult> => {
      try {
        if (enforced && !viaCloudFront) throw new Error(`Forbidden: Use api.${webDomain}`);
        if (!isOpenPath(method, path)) {
          session = await checkSession(headers).catch((error: Error) => {
            if (enforced) throw error;
            logger.error('Session check failed', { reason: error.message });
            return undefined;
          });
          if (enforced && session === 'overLimit') {
            throw new Error('TooManyRequests: Session limit reached');
          }
          if (enforced && session !== 'valid') throw new Error(`SessionRequired: Open ${webDomain}`);
        }
        const body = parseBody(event);
        if (!match) {
          logger.info('Not found', { method, path });
          return json({ message: '404 Not Found' }, 404);
        }
        routeKey = match.key;
        if (!anonymous) user = await getUser(headers);
        return await match.route({ method, path, params: match.params, headers, query, body, user });
      } catch (error) {
        const { status, code, errorMessage, isExpectedError } = parseExpectedError(error as Error);
        const message = errorMessage || 'Error occurred';
        const stack = (error as Error).stack;
        // Body, query and the user's email hold personal data, so they stay out of the log.
        const data = { httpRequest: { path, method, userId: user?.isaId }, route: routeKey ?? null, status, stack };
        if (isExpectedError) logger.warn(message, data);
        else logger.error(message, data);
        return json({ status, message, code }, status);
      }
    };

    const response = await respond();
    response.headers = { ...response.headers, ...responseHeaders(headers['origin']) };
    if (anonymous) {
      logger.info('Request', {
        route: match!.key,
        method,
        status: response.statusCode,
        latencyMs: Date.now() - start,
      });
      return response;
    }
    // One line per request for usage analytics; the headers as a whole carry the client's IP.
    logger.info('Request', {
      route: routeKey ?? null,
      method,
      status: response.statusCode,
      latencyMs: Date.now() - start,
      isaId: user?.isaId,
      origin: headers['origin'],
      referer: refererOrigin(headers['referer']),
      userAgent: headers['user-agent']?.slice(0, 256),
      country: headers['cloudfront-viewer-country'],
      asn: headers['cloudfront-viewer-asn'],
      session,
      viaCloudFront,
    });
    return response;
  };
};
