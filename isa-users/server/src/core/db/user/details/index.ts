import {
  BatchGetCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../aws/clients';
import { DDBUserDetailAttrs, DDBUserDetailItem } from './types';
import { INDEX_NAMES, TABLE_NAME, composeKey, destructKey, transformUtils } from '../../utils';

const { key, attrsToItem, itemToAttrs, keyFields, keyUtils } = transformUtils<
  DDBUserDetailItem,
  DDBUserDetailAttrs
>({
  PK: {
    fields: ['userId'],
    compose: (params) => composeKey('user', params.userId as string),
    destruct: (key) => ({
      userId: destructKey(key, 1),
    }),
  },
  SK_GSI: {
    compose: () => 'userDetails',
  },
  GSI_SK: {
    fields: ['email'],
    compose: (params) => composeKey('email', params.email as string),
    destruct: (key) => ({
      email: destructKey(key, 1),
    }),
  },
});

export const getUser = async (userId: string) => {
  return ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key({ userId }) })).then((data) => {
    if (data.Item) {
      return attrsToItem(data.Item as DDBUserDetailAttrs);
    }
    return null;
  });
};

export const getUsers = async (userIds: string[]) => {
  return ddb
    .send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: userIds.map((id) => key({ userId: id })),
          },
        },
      }),
    )
    .then((data) => {
      const items = data.Responses?.[TABLE_NAME] || [];
      return items.map((i) => attrsToItem(i as DDBUserDetailAttrs));
    });
};

export const getAllUsers = async () => {
  return ddb
    .send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI,
        KeyConditionExpression: '#SK_GSI = :SK_GSI',
        ExpressionAttributeNames: {
          '#SK_GSI': keyFields.SK_GSI,
        },
        ExpressionAttributeValues: {
          ':SK_GSI': keyUtils.SK_GSI!.compose({}),
        },
      }),
    )
    .then((data) => {
      const items = data.Items || [];
      return items.map((i) => attrsToItem(i as DDBUserDetailAttrs));
    });
};

export const putUser = async (user: DDBUserDetailItem) => {
  return ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: itemToAttrs(user) }));
};

// Only the counter is written, so a profile save at the same moment is never overwritten.
export const claimVerificationEmail = async (userId: string, day: string, max: number) => {
  const update = (
    expression: string,
    condition: string,
    names: Record<string, string>,
    values: Record<string, unknown>,
  ) =>
    ddb
      .send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: key({ userId }),
          UpdateExpression: expression,
          ConditionExpression: `attribute_exists(PK) AND (${condition})`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        }),
      )
      .then(() => true)
      .catch((error: Error) => {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
      });

  return (
    (await update(
      'SET verificationEmails.#count = verificationEmails.#count + :one',
      'verificationEmails.#day = :day AND verificationEmails.#count < :max',
      { '#day': 'day', '#count': 'count' },
      { ':one': 1, ':day': day, ':max': max },
    )) ||
    (await update(
      'SET verificationEmails = :first',
      'attribute_not_exists(verificationEmails) OR verificationEmails.#day <> :day',
      { '#day': 'day' },
      { ':first': { day, count: 1 }, ':day': day },
    ))
  );
};
