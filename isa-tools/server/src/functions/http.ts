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

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

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

// Routes are keyed "METHOD /path" in lower case; the path comes from the {proxy+} parameter.
export const createHandler = (
  lambdaName: string,
  routes: Record<string, Route>,
  notFoundMessage: (path: string) => string,
) => {
  logger.setLambdaName(lambdaName);

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const method = event.httpMethod.toUpperCase();
    const path = `/${event.pathParameters?.proxy ?? ''}`;
    const query = event.queryStringParameters ?? {};
    let body: any = {};
    try {
      body = parseBody(event);
      const headers = Object.fromEntries(
        Object.entries(event.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
      );
      const route = routes[`${method} ${path.replace(/\/+$/, '').toLowerCase()}`];
      if (!route) return json({ message: notFoundMessage(path) }, 404);
      return await route({ method, path, headers, query, body });
    } catch (error) {
      const message = (error as Error).message || 'Error occurred';
      const stack = (error as Error).stack;
      logger.error(message, { httpRequest: { path, body, method, query }, stack });
      return json({ status: 500, message, stack }, 500);
    }
  };
};
