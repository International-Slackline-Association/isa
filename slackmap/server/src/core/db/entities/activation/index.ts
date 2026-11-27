import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../../aws/clients';
import { INDEX_NAMES, KEY_FIELDS, TABLE_NAME, recursiveQuery } from '../../utils';

export type ActivatableFeatureType = 'line' | 'spot';

// Epoch seconds. The hash of the manage link's code never leaves the table; it is the only proof of ownership
// of an anonymous activation. activatedBy only when the member chose to activate with their name.
export type FeatureActivation = {
  featureType: ActivatableFeatureType;
  featureId: string;
  from: number;
  until: number;
  activatedAt: number;
  linkHash: string;
  activatedBy?: string;
  remind?: boolean;
  remindedAt?: number;
};

// Each date becomes a FeatureActivation when it starts, with this activatedAt and linkHash,
// so one manage link holds across all of them.
export type ActivationDates = {
  featureType: ActivatableFeatureType;
  featureId: string;
  dates: { from: number; until: number }[];
  activatedAt: number;
  linkHash: string;
  activatedBy: string;
  remind: boolean;
  remindedForUntil?: number;
};

export type ActivationAuth = { linkHash: string } | { activatedBy: string };

const skGsi = (featureType: ActivatableFeatureType) => `${featureType}Activation`;
const datesSkGsi = (featureType: ActivatableFeatureType) => `${featureType}ActivationDates`;

const key = (featureType: ActivatableFeatureType, featureId: string) => ({
  [KEY_FIELDS.PK]: `${featureType}:${featureId}`,
  [KEY_FIELDS.SK_GSI]: skGsi(featureType),
});
const datesKey = (featureType: ActivatableFeatureType, featureId: string) => ({
  [KEY_FIELDS.PK]: `${featureType}:${featureId}`,
  [KEY_FIELDS.SK_GSI]: datesSkGsi(featureType),
});

const authCondition = (auth: ActivationAuth) =>
  'linkHash' in auth
    ? { expression: 'linkHash = :auth', value: auth.linkHash }
    : { expression: 'activatedBy = :auth', value: auth.activatedBy };

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
    remind: item.remind,
    remindedAt: item.remindedAt,
  };
};

const toDates = (item: Record<string, any>): ActivationDates => {
  const featureType: ActivatableFeatureType = item[KEY_FIELDS.SK_GSI] === 'lineActivationDates' ? 'line' : 'spot';
  return {
    featureType,
    featureId: (item[KEY_FIELDS.PK] as string).slice(`${featureType}:`.length),
    dates: item.dates,
    activatedAt: item.activatedAt,
    linkHash: item.linkHash,
    activatedBy: item.activatedBy,
    remind: item.remind,
    remindedForUntil: item.remindedForUntil,
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
        remind: activation.remind,
        ddb_ttl: activation.until,
      },
      ConditionExpression: 'attribute_not_exists(PK) OR #until <= :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':now': now },
    }),
  );
};

// A link dies with its activation: an expired one waiting for TTL cannot be extended or ended.
// A new end can earn a new reminder.
const extendActivation = async (
  featureType: ActivatableFeatureType,
  featureId: string,
  auth: ActivationAuth,
  until: number,
  now: number,
) => {
  const condition = authCondition(auth);
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      UpdateExpression: 'SET #until = :until, ddb_ttl = :until REMOVE remindedAt',
      ConditionExpression: `${condition.expression} AND #until > :now`,
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':until': until, ':auth': condition.value, ':now': now },
    }),
  );
};

const setActivationRemind = async (
  featureType: ActivatableFeatureType,
  featureId: string,
  activatedBy: string,
  remind: boolean,
  now: number,
) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      UpdateExpression: 'SET remind = :remind',
      ConditionExpression: 'activatedBy = :auth AND #until > :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':remind': remind, ':auth': activatedBy, ':now': now },
    }),
  );
};

// Only for the end the email was about: an extension in between keeps the new end's reminder.
const markActivationReminded = async (featureType: ActivatableFeatureType, featureId: string, until: number, now: number) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      UpdateExpression: 'SET remindedAt = :now',
      ConditionExpression: '#until = :until',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':now': now, ':until': until },
    }),
  );
};

const endActivation = async (featureType: ActivatableFeatureType, featureId: string, auth: ActivationAuth, now: number) => {
  const condition = authCondition(auth);
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: key(featureType, featureId),
      ConditionExpression: `${condition.expression} AND #until > :now`,
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':auth': condition.value, ':now': now },
    }),
  );
};

const deleteActivation = async (featureType: ActivatableFeatureType, featureId: string) => {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key(featureType, featureId) }));
};

const getActivationDates = async (featureType: ActivatableFeatureType, featureId: string) => {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: datesKey(featureType, featureId) }));
  return Item ? toDates(Item) : null;
};

const getAllActivationDates = async (featureType: ActivatableFeatureType) => {
  const { items } = await recursiveQuery((lastEvaluatedKey) =>
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: INDEX_NAMES.GSI,
        ExclusiveStartKey: lastEvaluatedKey,
        KeyConditionExpression: '#SK_GSI = :SK_GSI',
        ExpressionAttributeNames: { '#SK_GSI': KEY_FIELDS.SK_GSI },
        ExpressionAttributeValues: { ':SK_GSI': datesSkGsi(featureType) },
      }),
    ),
  );
  return items.map(toDates);
};

const lastUntil = (dates: ActivationDates['dates']) => dates[dates.length - 1].until;

// A set whose last date has passed only waits for TTL.
const putActivationDates = async (activationDates: ActivationDates, now: number) => {
  const { featureType, featureId, dates } = activationDates;
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...datesKey(featureType, featureId),
        [KEY_FIELDS.GSI_SK]: `${featureType}:${featureId}`,
        dates,
        until: lastUntil(dates),
        activatedAt: activationDates.activatedAt,
        linkHash: activationDates.linkHash,
        activatedBy: activationDates.activatedBy,
        remind: activationDates.remind,
        ddb_ttl: lastUntil(dates),
      },
      ConditionExpression: 'attribute_not_exists(PK) OR #until <= :now',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':now': now },
    }),
  );
};

const updateActivationDates = async (
  featureType: ActivatableFeatureType,
  featureId: string,
  auth: ActivationAuth,
  change: { dates?: ActivationDates['dates']; remind?: boolean },
  now: number,
) => {
  const condition = authCondition(auth);
  const sets: string[] = [];
  const values: Record<string, unknown> = { ':auth': condition.value, ':now': now };
  if (change.dates) {
    sets.push('dates = :dates', '#until = :until', 'ddb_ttl = :until');
    values[':dates'] = change.dates;
    values[':until'] = lastUntil(change.dates);
  }
  if (change.remind !== undefined) {
    sets.push('remind = :remind');
    values[':remind'] = change.remind;
  }
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: datesKey(featureType, featureId),
      UpdateExpression: `SET ${sets.join(', ')}`,
      ConditionExpression: `${condition.expression} AND #until > :now`,
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: values,
    }),
  );
};

const markDatesReminded = async (featureType: ActivationDates['featureType'], featureId: string, forUntil: number) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: datesKey(featureType, featureId),
      UpdateExpression: 'SET remindedForUntil = :forUntil',
      ConditionExpression: '#until = :forUntil',
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':forUntil': forUntil },
    }),
  );
};

const endActivationDates = async (featureType: ActivatableFeatureType, featureId: string, auth: ActivationAuth, now: number) => {
  const condition = authCondition(auth);
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: datesKey(featureType, featureId),
      ConditionExpression: `${condition.expression} AND #until > :now`,
      ExpressionAttributeNames: { '#until': 'until' },
      ExpressionAttributeValues: { ':auth': condition.value, ':now': now },
    }),
  );
};

const deleteActivationDates = async (featureType: ActivatableFeatureType, featureId: string) => {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: datesKey(featureType, featureId) }));
};

export const activationDB = {
  getActivation,
  getAllActivations,
  putActivation,
  extendActivation,
  setActivationRemind,
  markActivationReminded,
  endActivation,
  deleteActivation,
  getActivationDates,
  getAllActivationDates,
  putActivationDates,
  updateActivationDates,
  markDatesReminded,
  endActivationDates,
  deleteActivationDates,
};
