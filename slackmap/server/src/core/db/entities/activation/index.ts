import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../aws/clients';
import { INDEX_NAMES, KEY_FIELDS, TABLE_NAME, recursiveQuery } from '../../utils';

export type ActivatableFeatureType = 'line' | 'spot';

// Epoch seconds. The hash of the manage link's code is the only proof of ownership and never leaves the table.
// activatedBy only when the member chose to activate with their name; an anonymous one never has it.
export type FeatureActivation = {
  featureType: ActivatableFeatureType;
  featureId: string;
  from: number;
  until: number;
  activatedAt: number;
  linkHash: string;
  activatedBy?: string;
};

const skGsi = (featureType: ActivatableFeatureType) => `${featureType}Activation`;

const key = (featureType: ActivatableFeatureType, featureId: string) => ({
  [KEY_FIELDS.PK]: `${featureType}:${featureId}`,
  [KEY_FIELDS.SK_GSI]: skGsi(featureType),
});

const featureTypeOfSk = (sk: unknown): ActivatableFeatureType | undefined =>
  sk === 'lineActivation' ? 'line' : sk === 'spotActivation' ? 'spot' : undefined;

const toActivation = (item: Record<string, any>): FeatureActivation => {
  const featureType = featureTypeOfSk(item[KEY_FIELDS.SK_GSI])!;
  return {
    featureType,
    featureId: (item[KEY_FIELDS.PK] as string).slice(`${featureType}:`.length),
    from: item.from ?? item.activatedAt,
    until: item.until,
    activatedAt: item.activatedAt,
    linkHash: item.linkHash,
    activatedBy: item.activatedBy,
  };
};

export const isActivationItem = (keys: Record<string, any>) => featureTypeOfSk(keys[KEY_FIELDS.SK_GSI]) !== undefined;
export const activationFromItem = (item: Record<string, any>) => toActivation(item);

const getActivation = async (featureType: ActivatableFeatureType, featureId: string) => {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key(featureType, featureId) }));
  return Item ? toActivation(Item) : null;
};

const getAllActivations = async (featureType: ActivatableFeatureType) => {
  const { items } = await recursiveQuery((lastEvaluatedKey) =>
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI,
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: '#SK_GSI = :SK_GSI',
        ExpressionAttributeNames: { '#SK_GSI': KEY_FIELDS.SK_GSI },
        ExpressionAttributeValues: { ':SK_GSI': skGsi(featureType) },
      }),
    ),
  );
  return items.map(toActivation);
};

const putActivation = async (activation: FeatureActivation, now: number) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...key(activation.featureType, activation.featureId),
        [KEY_FIELDS.GSI_SK]: `${activation.featureType}:${activation.featureId}`,
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
const extendActivation = async (
  featureType: ActivatableFeatureType,
  featureId: string,
  linkHash: string,
  until: number,
  now: number,
) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      UpdateExpression: 'SET #until = :until, ddb_ttl = :until',
      ConditionExpression: 'linkHash = :linkHash AND #until > :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':until': until, ':linkHash': linkHash, ':now': now },
    }),
  );
};

const endActivation = async (featureType: ActivatableFeatureType, featureId: string, linkHash: string, now: number) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      ConditionExpression: 'linkHash = :linkHash AND #until > :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':linkHash': linkHash, ':now': now },
    }),
  );
};

const deleteActivation = async (featureType: ActivatableFeatureType, featureId: string) => {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key(featureType, featureId) }));
};

export const activationDB = {
  getActivation,
  getAllActivations,
  putActivation,
  extendActivation,
  endActivation,
  deleteActivation,
};
