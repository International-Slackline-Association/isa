import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ZodError, ZodTypeAny, z } from 'zod';

import { logger } from '../core/logger';

export type Request = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body: any;
};

export type Route = (request: Request) => Promise<APIGatewayProxyResult>;

export const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export const json = (data: unknown, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
});

export const validate = <T extends ZodTypeAny>(payload: unknown, schema: T): z.infer<T> => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation: ${error.issues[0].path?.[0]}: ${error.issues[0].message}.`);
    }
    throw error;
  }
};

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
  notFoundMessage: (path: string) => string,
) => {
  logger.setLambdaName(lambdaName);
  const routesByKey = Object.fromEntries(
    Object.entries(routes).map(([key, route]) => [key.toLowerCase(), route]),
  );

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const method = event.httpMethod.toUpperCase();
    const path = `/${event.pathParameters?.proxy ?? ''}`;
    const query = event.queryStringParameters ?? {};
    const headers = Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
    );
    const start = Date.now();
    let routeKey: string | undefined;

    const respond = async (): Promise<APIGatewayProxyResult> => {
      try {
        const body = parseBody(event);
        // Express answered HEAD from GET routes.
        const routeMethod = method === 'HEAD' ? 'GET' : method;
        const key = `${routeMethod} ${path.replace(/\/+$/, '')}`;
        const route = routesByKey[key.toLowerCase()];
        if (!route) {
          logger.info('Not found', { method, path });
          return json({ message: notFoundMessage(path) }, 404);
        }
        routeKey = key;
        return await route({ method, path, headers, query, body });
      } catch (error) {
        const message = (error as Error).message || 'Error occurred';
        const stack = (error as Error).stack;
        // Body and query hold personal data, so they stay out of the log. A caller's mistake is a
        // warning, so only real failures reach the error digest.
        const data = { httpRequest: { path, method }, route: routeKey ?? null, stack };
        if (/^(Unauthorized|Validation|NotFound|Expired|Invalid)\b|not found/i.test(message)) {
          logger.warn(message, data);
        } else {
          logger.error(message, data);
        }
        return json({ status: 500, message }, 500);
      }
    };

    const response = await respond();
    // One line per request for usage analytics; the headers as a whole carry the client's IP.
    logger.info('Request', {
      route: routeKey ?? null,
      method,
      status: response.statusCode,
      latencyMs: Date.now() - start,
      origin: headers['origin'],
      referer: refererOrigin(headers['referer']),
      userAgent: headers['user-agent']?.slice(0, 256),
    });
    return response;
  };
};
