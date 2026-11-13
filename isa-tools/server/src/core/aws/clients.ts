import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SSMClient } from '@aws-sdk/client-ssm';
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
      logger.error(`DynamoDB Error`, {
        // The input holds the document data, so only the command is logged.
        command: context.commandName || args.constructor.name,
        error: (error as any).message,
      });
      throw error;
    }
  },
  {
    step: 'initialize',
    name: 'ddbErrorLogger',
  },
);

export const s3 = new S3Client({
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
export const ssm = new SSMClient();
