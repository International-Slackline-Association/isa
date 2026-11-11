import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from 'core/aws/clients';
import { DDBGenericHashAttrs, DDBGenericHashItem } from 'core/db/genericHash/types';
import { TABLE_NAME, transformUtils } from 'core/db/utils';

import { ConvertKeysToInterface, TransformerParams } from '../types';

const keysUsed = ['PK', 'SK_GSI'] as const;

const typeSafeCheck = <
  T extends TransformerParams<
    Omit<DDBGenericHashItem, keyof DDBGenericHashAttrs>,
    ConvertKeysToInterface<typeof keysUsed>
  >,
>(
  v: T,
) => {
  return v;
};

const keyUtils = typeSafeCheck({
  PK: {
    fields: [],
    compose: () => 'genericHashes',
  },
  SK_GSI: {
    fields: ['hash'],
    compose: (param) => param.hash!,
    destruct: (key) => ({
      hash: key,
    }),
  },
});

const { key, attrsToItem, itemToAttrs } = transformUtils<
  DDBGenericHashItem,
  DDBGenericHashAttrs,
  typeof keysUsed
>(keyUtils);

export const getHash = async (hash: string) => {
  return ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key({ hash }) })).then((data) => {
    if (data.Item) {
      return attrsToItem(data.Item as DDBGenericHashAttrs);
    }
    return null;
  });
};

export const putHash = async (hash: DDBGenericHashItem) => {
  return ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: itemToAttrs(hash) }));
};
