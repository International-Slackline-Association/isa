import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../aws/clients';
import { KEY_FIELDS, TABLE_NAME } from '../../utils';

// A member's count per month only: no times, no record of which passes were signed.
const countKey = (isaId: string, month: string) => ({
  [KEY_FIELDS.PK]: `user:${isaId}`,
  [KEY_FIELDS.SK_GSI]: `passCount:${month}`,
});

// The update holds only if the count is still what was read, so two devices cannot both take the last ones.
const takeFromPassCount = async (isaId: string, month: string, wanted: number, limit: number, expiresAt: number) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: countKey(isaId, month) }));
    const count = (Item?.count as number | undefined) ?? 0;
    const amount = Math.min(wanted, limit - count);
    if (amount <= 0) return { amount: 0, used: count };
    const taken = await ddb
      .send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: countKey(isaId, month),
          UpdateExpression: 'SET #count = :next, ddb_ttl = if_not_exists(ddb_ttl, :ttl)',
          ConditionExpression: Item ? '#count = :count' : 'attribute_not_exists(PK)',
          ExpressionAttributeNames: { '#count': 'count' },
          ExpressionAttributeValues: {
            ':next': count + amount,
            ':ttl': expiresAt,
            ...(Item ? { ':count': count } : {}),
          },
        }),
      )
      .then(() => true)
      .catch((error) => {
        if ((error as Error).name === 'ConditionalCheckFailedException') return false;
        throw error;
      });
    if (taken) return { amount, used: count + amount };
  }
  throw new Error('TooManyRequests: Passes are being taken at the same time, try again');
};

// Kept without TTL: a pass stays valid as long as the signing key does.
const spendPass = async (passHash: string) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { [KEY_FIELDS.PK]: `pass:${passHash}`, [KEY_FIELDS.SK_GSI]: 'spentPass' },
      ConditionExpression: 'attribute_not_exists(PK)',
    }),
  );
};

export const passDB = { takeFromPassCount, spendPass };
