import serverlessExpress from '@vendia/serverless-express';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { logger } from 'core/utils/logger';

import app from './app';

logger.updateMeta({ lambdaName: 'image-processor-api' });
const handler = serverlessExpress({ app });

// Node.js 24 Lambda rejects handlers that take a callback; serverless-express resolves a promise instead.
export const main = (event: APIGatewayProxyEvent, context: Context) =>
  handler(event, context, () => {});
