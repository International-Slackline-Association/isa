import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../../aws/clients';
import {
  INDEX_NAMES,
  KEY_FIELDS,
  TABLE_NAME,
  batchGet,
  composeKey,
  composeKeyStrictly,
  destructKey,
  recursiveQuery,
} from '../../../utils';
import {
  DDBEntityConverter,
  EntityKeysComposer,
  EntityKeysParser,
} from '../../../utils/entityConverter';

import { DDBGroupDetailTypes } from './types';

type PrimaryKeyAttrs = DDBGroupDetailTypes['PrimaryKeyAttrs'];
type AllKeyAttrs = DDBGroupDetailTypes['AllKeyAttrs'];
type Entity = DDBGroupDetailTypes['Entity'];
type Item = DDBGroupDetailTypes['Item'];

const keyAttrs: (keyof AllKeyAttrs)[] = ['groupId', 'country'];
const keyComposers = (<T extends EntityKeysComposer<PrimaryKeyAttrs, AllKeyAttrs>>(p: T) => p)({
  PK: (item: { groupId: string }) => composeKey('group', item.groupId),
  SK_GSI: () => 'groupDetails',
  GSI_SK: (item) => composeKeyStrictly('group', item.groupId),
  GSI2: (item) => composeKeyStrictly('country', item.country),
  GSI2_SK: () => composeKey('featureType', 'group'),
});
const keyParsers: EntityKeysParser<AllKeyAttrs> = {
  PK: (key) => ({
    groupId: destructKey(key, 1),
  }),
  SK_GSI: () => ({}),
  GSI2: (key) => ({
    country: destructKey(key, 1),
  }),
};

const converter = new DDBEntityConverter<PrimaryKeyAttrs, AllKeyAttrs, Entity, Item>(
  keyAttrs,
  keyComposers,
  keyParsers,
);

const getAllGroups = async () => {
  const results = await recursiveQuery(async (lastEvaluatedKey) => {
    return ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI,
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: '#SK_GSI = :SK_GSI',
        ExpressionAttributeNames: { '#SK_GSI': KEY_FIELDS.SK_GSI },
        ExpressionAttributeValues: { ':SK_GSI': keyComposers.SK_GSI() },
      }),
    );
  });
  return results.items.map((r) => converter.itemToEntity(r as Item));
};

// GSI2 projects keys only, so the items are read again.
const getGroupsOfCountry = async (country: string) => {
  const results = await recursiveQuery(async (lastEvaluatedKey) => {
    return ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI2,
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: '#GSI2 = :GSI2 and #GSI2_SK = :GSI2_SK',
        ExpressionAttributeNames: { '#GSI2': KEY_FIELDS.GSI2, '#GSI2_SK': KEY_FIELDS.GSI2_SK },
        ExpressionAttributeValues: {
          ':GSI2': keyComposers.GSI2({ country }),
          ':GSI2_SK': keyComposers.GSI2_SK(),
        },
      }),
    );
  });
  const items = await batchGet(results.items.map((i) => ({ PK: i.PK, SK_GSI: i.SK_GSI })));
  return items.filter((i) => i).map((i) => converter.itemToEntity(i as Item));
};

const getGroupDetails = async (groupId: string) => {
  const data = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: converter.key({ groupId }) }),
  );
  return data.Item ? converter.itemToEntity(data.Item as Item) : null;
};

const putGroup = async (group: Entity, opts: { onlyIfNew?: boolean } = {}) => {
  return ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: converter.entityToItem(group),
      ConditionExpression: opts.onlyIfNew ? 'attribute_not_exists(PK)' : undefined,
    }),
  );
};

const deleteGroup = async (groupId: string) => {
  return ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: converter.key({ groupId }) }));
};

export const groupDetailsDB = {
  converter,
  getAllGroups,
  getGroupsOfCountry,
  getGroupDetails,
  putGroup,
  deleteGroup,
};
