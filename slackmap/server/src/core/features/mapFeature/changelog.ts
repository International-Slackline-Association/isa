import { db } from '../../db';
import { DDBGroupDetailTypes } from '../../db/entities/group/details/types';
import { DDBGuideDetailTypes } from '../../db/entities/guide/details/types';
import { DDBLineDetailTypes } from '../../db/entities/line/details/types';
import { DDBMapFeatureChangelogTypes } from '../../db/entities/mapFeature/changelog/types';
import { DDBSpotDetailTypes } from '../../db/entities/spot/details/types';
import { MapFeatureType } from '../../types';
import countriesJson from '../../../../data/countryInfoDict.json';

import { genericFeatureFromItem } from '.';
import { getMultipleUserDetails } from '../isaUser';
import { GenericMapFeatureItemType } from './types';

type AllFieldNames = keyof (DDBLineDetailTypes['Entity'] &
  DDBSpotDetailTypes['Entity'] &
  DDBGuideDetailTypes['Entity'] &
  DDBGroupDetailTypes['Entity']);

const pathNamesMapping: { [p in AllFieldNames]: string | null } = {
  name: 'name',
  type: 'type',
  geoJson: 'coordinates',
  description: 'description',
  length: 'length',
  height: 'height',
  anchorsInfo: 'anchor',
  gearInfo: 'gear',
  accessInfo: 'access',
  contactInfo: 'contact',
  restrictionLevel: 'restriction level',
  restrictionInfo: 'restriction info',
  extraInfo: 'additional details',
  anchorImages: 'anchor images',
  images: 'images',
  country: 'country',
  createdDateTime: null,
  creatorUserId: null,
  lastModifiedDateTime: null,
  spotId: null,
  lineId: null,
  guideId: null,
  isMeasured: null,
  groupId: null,
  email: 'email',
  facebookPage: 'Facebook page',
  facebookGroup: 'Facebook group',
  instagram: 'Instagram',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  webpage: 'web page',
  isaMemberType: 'ISA membership',
  isaMemberInfoUrl: 'ISA membership link',
};

const validPathNames = Object.entries(pathNamesMapping)
  .filter(([, v]) => v !== null)
  .map(([k]) => k);

const valueKind = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

// A top-level key counts as changed when it is added, removed, a primitive or its type changed,
// or an array changed length. Edits inside objects or inside same-length arrays are not logged.
const changedTopLevelKeys = (oldItem: object, newItem: object) => {
  const o = oldItem as Record<string, unknown>;
  const n = newItem as Record<string, unknown>;
  const has = (obj: object, k: string) => Object.prototype.hasOwnProperty.call(obj, k);
  const keys = [...Object.keys(o), ...Object.keys(n).filter((k) => !has(o, k))];

  return keys.filter((k) => {
    if (has(o, k) !== has(n, k)) {
      return true;
    }
    const [l, r] = [o[k], n[k]];
    if (valueKind(l) !== valueKind(r)) {
      return true;
    }
    if (Array.isArray(l) && Array.isArray(r)) {
      return l.length !== r.length;
    }
    if (typeof l === 'object') {
      return false;
    }
    return l !== r && !(Number.isNaN(l) && Number.isNaN(r));
  });
};

export const addCreatedChangelogToFeature = async (
  item: GenericMapFeatureItemType,
  userId: string,
  date: Date,
) => {
  const feature = genericFeatureFromItem(item);
  await db.putFeatureChangelog({
    featureId: feature.id,
    featureType: feature.type,
    userId: userId,
    action: 'created',
    date: date.toISOString(),
    country: feature.country,
  });
};

export const addUpdatedDetailsChangelog = async (
  item: GenericMapFeatureItemType,
  oldItem: GenericMapFeatureItemType,
  userId: string,
  date: Date,
) => {
  const feature = genericFeatureFromItem(item);

  const distinctUpdatedPaths = changedTopLevelKeys(oldItem, item).filter((k) =>
    validPathNames.includes(k),
  );

  if (distinctUpdatedPaths.length === 0) {
    return;
  }

  // Filter out paths that were added with default values
  const filteredPathsWithDefaultValues = distinctUpdatedPaths.filter((p) => {
    const newValue = (item as any)[p];
    if (newValue instanceof Array) {
      if ((oldItem as any)[p] === undefined && newValue.length === 0) {
        return false; // recently added array with default value of []
      }
    }
    return true;
  });

  await db.putFeatureChangelog({
    featureId: feature.id,
    featureType: feature.type,
    userId: userId,
    action: 'updatedDetails',
    date: date.toISOString(),
    country: feature.country,
    updatedPaths: filteredPathsWithDefaultValues,
  });
};

export const addUpdatedOwnersChangelog = async (
  item: GenericMapFeatureItemType,
  userId: string,
  date: Date,
) => {
  const feature = genericFeatureFromItem(item);
  await db.putFeatureChangelog({
    featureId: feature.id,
    featureType: feature.type,
    userId: userId,
    action: 'updatedOwners',
    date: date.toISOString(),
    country: feature.country,
  });
};

export const addTemporaryEditorChangelogToFeature = async (
  featureId: string,
  featureType: MapFeatureType,
  userId: string,
  date: Date,
  country: string,
) => {
  await db.putFeatureChangelog({
    featureId: featureId,
    featureType: featureType,
    userId: userId,
    action: 'grantedTemporaryEditor',
    date: date.toISOString(),
    country: country,
  });
};

export const getChangelogsOfFeature = async (
  featureId: string,
  featureType: MapFeatureType,
  opts: {
    startKey?: any;
    limit?: number;
  } = {},
) => {
  const { items, lastEvaluatedKey } = await db.getFeatureChangelogs(featureId, featureType, opts);
  const featureChangelogs = await db.getMultipleFeatureChangelog(items);
  const userDetailsDict = await getMultipleUserDetails(featureChangelogs.map((c) => c.userId));
  const changelogs = featureChangelogs.map((c) => {
    return { ...prettifyChangelog(c), user: userDetailsDict[c.userId] };
  });
  return { changelogs, lastEvaluatedKey };
};

export const getChangelogsOfCountry = async (
  code: string,
  opts: {
    startKey?: any;
    limit?: number;
  } = {},
) => {
  const {
    items: { mapFeatureChangelogs },
    lastEvaluatedKey,
  } = await db.getCountryChangelogs(code, opts);
  const featureChangelogs = await db.getMultipleFeatureChangelog(mapFeatureChangelogs);
  const userDetailsDict = await getMultipleUserDetails(featureChangelogs.map((c) => c.userId));
  const changelogs = featureChangelogs.map((c) => {
    return { ...prettifyChangelog(c), user: userDetailsDict[c.userId] };
  });

  return { changelogs, lastEvaluatedKey };
};

export const getChangelogsOfGlobal = async (
  opts: {
    startKey?: any;
    limit?: number;
  } = {},
) => {
  const {
    items: { mapFeatureChangelogs },
    lastEvaluatedKey,
  } = await db.getGlobalChangelogs(opts);
  const featureChangelogs = await db.getMultipleFeatureChangelog(mapFeatureChangelogs);
  const userDetailsDict = await getMultipleUserDetails(featureChangelogs.map((c) => c.userId));
  const changelogs = featureChangelogs.map((c) => {
    return { ...prettifyChangelog(c), user: userDetailsDict[c.userId] };
  });
  return { changelogs, lastEvaluatedKey };
};

const prettifyChangelog = (changelog: DDBMapFeatureChangelogTypes['Entity']) => {
  const paths = changelog.updatedPaths
    ?.map((p) => pathNamesMapping[p as AllFieldNames])
    .filter((p) => p);
  const pathsString =
    paths && paths.slice(0, -1).join(', ') + (paths.length > 1 ? ', and ' : '') + paths.slice(-1);

  return {
    featureId: changelog.featureId,
    featureType: changelog.featureType,
    date: changelog.date,
    countryName:
      countriesJson[changelog.country as keyof typeof countriesJson]?.name || changelog.country,
    actionType: changelog.action,
    updatedPathsString: pathsString,
  };
};
