import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { logger } from '../logger';

const dynamoDB = new DynamoDBClient({});

export const ddb = DynamoDBDocumentClient.from(dynamoDB, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
ddb.middlewareStack.add(
  (next, context) => async (args) => {
    try {
      return await next(args);
    } catch (error) {
      // The command input holds the user item, so it stays out of the log.
      logger.error(`DynamoDB Error`, {
        command: context.commandName || args.constructor.name,
        error: (error as Error).message,
      });
      throw error;
    }
  },
  {
    step: 'initialize',
    name: 'ddbErrorLogger',
  },
);

export const s3 = new S3Client({});
export const ses = new SESClient();
export const cisProvider = new CognitoIdentityProviderClient();
