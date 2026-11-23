import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../../aws/clients';
import { INDEX_NAMES, KEY_FIELDS, TABLE_NAME, recursiveQuery } from '../../../utils';

// Epoch seconds. The hash of the manage link's code is the only proof of ownership and never leaves the table.
// activatedBy only when the member chose to activate with their name; an anonymous one never has it.
export type LineActivation = {
  lineId: string;
  from: number;
  until: number;
  activatedAt: number;
  linkHash: string;
  activatedBy?: string;
};

const skGsi = 'lineActivation';

const key = (lineId: string) => ({ [KEY_FIELDS.PK]: `line:${lineId}`, [KEY_FIELDS.SK_GSI]: skGsi });

const toActivation = (item: Record<string, any>): LineActivation => ({
  lineId: (item[KEY_FIELDS.PK] as string).slice('line:'.length),
  from: item.from ?? item.activatedAt,
  until: item.until,
  activatedAt: item.activatedAt,
  linkHash: item.linkHash,
  activatedBy: item.activatedBy,
});

export const isLineActivationItem = (keys: Record<string, any>) => keys[KEY_FIELDS.SK_GSI] === skGsi;
export const lineActivationFromItem = (item: Record<string, any>) => toActivation(item);

const getLineActivation = async (lineId: string) => {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key(lineId) }));
  return Item ? toActivation(Item) : null;
};

const getAllLineActivations = async () => {
  const { items } = await recursiveQuery((lastEvaluatedKey) =>
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI,
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: '#SK_GSI = :SK_GSI',
        ExpressionAttributeNames: { '#SK_GSI': KEY_FIELDS.SK_GSI },
        ExpressionAttributeValues: { ':SK_GSI': skGsi },
      }),
    ),
  );
  return items.map(toActivation);
};

const putLineActivation = async (activation: LineActivation, now: number) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...key(activation.lineId),
        [KEY_FIELDS.GSI_SK]: `line:${activation.lineId}`,
        from: activation.from,
        until: activation.until,
        activatedAt: activation.activatedAt,
        linkHash: activation.linkHash,
        activatedBy: activation.activatedBy,
        ddb_ttl: activation.until,
      },
      ConditionExpression: 'attribute_not_exists(PK) OR #until <= :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':now': now },
    }),
  );
};

// A link dies with its activation: an expired one waiting for TTL cannot be extended or ended.
const extendLineActivation = async (lineId: string, linkHash: string, until: number, now: number) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(lineId),
      UpdateExpression: 'SET #until = :until, ddb_ttl = :until',
      ConditionExpression: 'linkHash = :linkHash AND #until > :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':until': until, ':linkHash': linkHash, ':now': now },
    }),
  );
};

const endLineActivation = async (lineId: string, linkHash: string, now: number) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key(lineId),
      ConditionExpression: 'linkHash = :linkHash AND #until > :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':linkHash': linkHash, ':now': now },
    }),
  );
};

const deleteLineActivation = async (lineId: string) => {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key(lineId) }));
};

export const lineActivationDB = {
  getLineActivation,
  getAllLineActivations,
  putLineActivation,
  extendLineActivation,
  endLineActivation,
  deleteLineActivation,
};
