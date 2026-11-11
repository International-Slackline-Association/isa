import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { ddb } from './aws/clients';

const partitionKey = 'genericHashes';

export type HashItem = {
  hash: string;
  ddb_ttl: number;
  value: string;
  description: string;
  createdDate: string;
};

export const getHash = async (hash: string) => {
  const { Item } = await ddb.send(
    new GetCommand({
      TableName: process.env.ISA_DOCUMENTS_TABLE_NAME,
      Key: { PK: partitionKey, SK_GSI: hash },
    }),
  );
  return (Item as { value: string } | undefined) ?? null;
};

export const putHash = async ({ hash, ...attributes }: HashItem) => {
  await ddb.send(
    new PutCommand({
      TableName: process.env.ISA_DOCUMENTS_TABLE_NAME,
      Item: { PK: partitionKey, SK_GSI: hash, ...attributes },
    }),
  );
};
