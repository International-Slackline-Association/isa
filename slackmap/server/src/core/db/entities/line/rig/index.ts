import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../../aws/clients';
import { INDEX_NAMES, KEY_FIELDS, TABLE_NAME, recursiveQuery } from '../../../utils';

// Epoch seconds. The hash of the manage link's code is the only proof of ownership and never leaves the table.
export type LineRig = { lineId: string; until: number; reportedAt: number; linkHash: string };

const skGsi = 'lineRig';
// The item outlives its "until" a little, so a rig that just ran out can still be read; TTL deletes it after.
const ttlGraceSeconds = 2 * 24 * 60 * 60;

const key = (lineId: string) => ({ [KEY_FIELDS.PK]: `line:${lineId}`, [KEY_FIELDS.SK_GSI]: skGsi });

const toRig = (item: Record<string, any>): LineRig => ({
  lineId: (item[KEY_FIELDS.PK] as string).slice('line:'.length),
  until: item.until,
  reportedAt: item.reportedAt,
  linkHash: item.linkHash,
});

export const isLineRigItem = (keys: Record<string, any>) => keys[KEY_FIELDS.SK_GSI] === skGsi;
export const lineRigFromItem = (item: Record<string, any>) => toRig(item);

const getLineRig = async (lineId: string) => {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key(lineId) }));
  return Item ? toRig(Item) : null;
};

const getAllLineRigs = async () => {
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
  return items.map(toRig);
};

// Fails when a rig that has not run out is already there; an expired one waiting for TTL is replaced.
const putLineRig = async (rig: LineRig, now: number) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...key(rig.lineId),
        [KEY_FIELDS.GSI_SK]: `line:${rig.lineId}`,
        until: rig.until,
        reportedAt: rig.reportedAt,
        linkHash: rig.linkHash,
        ddb_ttl: rig.until + ttlGraceSeconds,
      },
      ConditionExpression: 'attribute_not_exists(PK) OR #until <= :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':now': now },
    }),
  );
};

const extendLineRig = async (lineId: string, linkHash: string, until: number) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(lineId),
      UpdateExpression: 'SET #until = :until, ddb_ttl = :ttl',
      ConditionExpression: 'linkHash = :linkHash',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':until': until, ':ttl': until + ttlGraceSeconds, ':linkHash': linkHash },
    }),
  );
};

const endLineRig = async (lineId: string, linkHash: string) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key(lineId),
      ConditionExpression: 'linkHash = :linkHash',
      ExpressionAttributeValues: { ':linkHash': linkHash },
    }),
  );
};

// The line is gone, so its rig goes with it.
const deleteLineRig = async (lineId: string) => {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key(lineId) }));
};

export const lineRigDB = {
  getLineRig,
  getAllLineRigs,
  putLineRig,
  extendLineRig,
  endLineRig,
  deleteLineRig,
};
