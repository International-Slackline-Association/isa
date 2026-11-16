import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../../aws/clients';
import { KEY_FIELDS, TABLE_NAME } from '../../../utils';

export type ContributorAgreement = { isaId: string; version: string; acceptedAt: string };

const key = (isaId: string) => ({
  [KEY_FIELDS.PK]: `user:${isaId}`,
  [KEY_FIELDS.SK_GSI]: 'contributorAgreement',
});

const getContributorAgreement = async (isaId: string) => {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: key(isaId) }));
  return Item ? ({ isaId, version: Item.version, acceptedAt: Item.acceptedAt } as ContributorAgreement) : null;
};

const putContributorAgreement = async (agreement: ContributorAgreement) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...key(agreement.isaId), version: agreement.version, acceptedAt: agreement.acceptedAt },
    }),
  );
};

export const contributorAgreementDB = { getContributorAgreement, putContributorAgreement };
