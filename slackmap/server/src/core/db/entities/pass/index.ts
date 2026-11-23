import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../aws/clients';
import { KEY_FIELDS, TABLE_NAME } from '../../utils';

// A member's count per month only: no times, no record of which passes were signed.
const countKey = (isaId: string, month: string) => ({
  [KEY_FIELDS.PK]: `user:${isaId}`,
  [KEY_FIELDS.SK_GSI]: `passCount:${month}`,
});

// Fails when the count would pass the limit, so a member never gets more than the limit in a month.
const addToPassCount = async (isaId: string, month: string, amount: number, limit: number, expiresAt: number) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: countKey(isaId, month),
      UpdateExpression: 'ADD #count :amount SET ddb_ttl = if_not_exists(ddb_ttl, :ttl)',
      ConditionExpression: 'attribute_not_exists(#count) OR #count <= :max',
      ExpressionAttributeNames: { '#count': 'count' },
      ExpressionAttributeValues: { ':amount': amount, ':max': limit - amount, ':ttl': expiresAt },
    }),
  );
};

// Fails when the pass was spent before. Kept without TTL: a pass stays valid as long as the signing key does.
const spendPass = async (passHash: string) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { [KEY_FIELDS.PK]: `pass:${passHash}`, [KEY_FIELDS.SK_GSI]: 'spentPass' },
      ConditionExpression: 'attribute_not_exists(PK)',
    }),
  );
};

export const passDB = { addToPassCount, spendPass };
