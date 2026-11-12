import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { logger } from '../core/logger';
import { generateISAIdFromUsername } from '../core/utils';

export type User = {
  isaId: string;
  email: string;
  sub: string;
};

export type Request = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body: any;
  // Set from the authorizer claims; absent on the /verify resource, which has no authorizer.
  user?: User;
};

export type Route = (request: Request) => Promise<APIGatewayProxyResult>;

export const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export const json = (data: unknown, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
});

export const html = (body: string): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  body,
});

const parseBody = (event: APIGatewayProxyEvent) => {
  const contentType = Object.entries(event.headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'content-type',
  )?.[1];
  if (!contentType?.toLowerCase().startsWith('application/json') || !event.body) return {};

  const text = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
  const body = JSON.parse(text);
  if (typeof body !== 'object' || body === null) {
    throw new SyntaxError('Request body must be a JSON object or array');
  }
  return body;
};

// The resource (/{proxy+} or /verify/{proxy+}) filled with the path parameters. event.path can carry
// a stage or base path in front, so the routes are matched against this instead.
const resolvePath = (event: APIGatewayProxyEvent) => {
  let path = event.resource;
  for (const [name, value] of Object.entries(event.pathParameters ?? {})) {
    path = path.replace(name === 'proxy' ? '{proxy+}' : `{${name}}`, () => String(value));
  }
  if (event.path.endsWith('/') && !path.endsWith('/')) path += '/';
  return path;
};

const getUser = (event: APIGatewayProxyEvent): User | undefined => {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims) return undefined;
  return {
    isaId: claims['cognito:username'] && generateISAIdFromUsername(claims['cognito:username']),
    email: claims.email,
    sub: claims.sub,
  };
};

export const createHandler = (
  lambdaName: string,
  routes: Record<string, Route>,
  notFoundMessage: (path: string) => string,
) => {
  logger.setLambdaName(lambdaName);
  const routesByKey = Object.fromEntries(
    Object.entries(routes).map(([key, route]) => [key.toLowerCase(), route]),
  );

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const method = event.httpMethod.toUpperCase();
    const path = resolvePath(event);
    const query = event.queryStringParameters ?? {};
    const headers = Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
    );

    try {
      const body = parseBody(event);
      // Express answered HEAD from GET routes.
      const routeMethod = method === 'HEAD' ? 'GET' : method;
      const route = routesByKey[`${routeMethod} ${path.replace(/\/$/, '')}`.toLowerCase()];
      if (!route) {
        logger.info('Not found', { method, path });
        return json({ message: notFoundMessage(path) }, 404);
      }
      return await route({ method, path, headers, query, body, user: getUser(event) });
    } catch (error) {
      const message = (error as Error).message || 'Error occurred';
      const stack = (error as Error).stack;
      // Body and query hold personal data and the verification token, so they stay out of the log.
      logger.error(message, { httpRequest: { path, method }, stack });
      return json({ status: 500, message, stack }, 500);
    }
  };
};
