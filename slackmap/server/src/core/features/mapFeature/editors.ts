import { db } from '../../db';
import { DDBMapFeatureEditorTypes } from '../../db/entities/mapFeature/editor/types';
import { MapFeatureType } from '../../types';

import { checkUserExists } from '../isaUser';

type FeatureEditor = DDBMapFeatureEditorTypes['Entity'];

export const isSlackmapAdmin = (userId?: string) =>
  Boolean(userId) && userId === process.env.SLACKMAP_ADMIN_ISA_ID;

export const addTemporaryEditorToMapFeature = async (
  featureId: string,
  featureType: MapFeatureType,
  userId: string,
) => {
  await checkUserExists(userId);
  await db.putFeatureEditor({
    featureId: featureId,
    featureType: featureType,
    userId: userId,
    reason: 'temporary',
    createdDateTime: new Date().toISOString(),
    ddb_ttl: Math.round(Date.now() / 1000) + 60 * 60 * 24, // 1 day
  });
};

export const validateMapFeatureEditor = async (
  featureId: string,
  featureType: MapFeatureType,
  userId?: string,
  opts: {
    shouldThrow?: boolean;
  } = {},
): Promise<FeatureEditor | null> => {
  if (!userId) {
    if (opts.shouldThrow) {
      throw new Error('Forbidden: User is not logged in');
    }
    return null;
  }
  let featureEditor: FeatureEditor | null = null;
  if (featureType === 'group' && isSlackmapAdmin(userId)) {
    featureEditor = {
      featureId,
      featureType,
      userId,
      reason: 'explicit',
      type: 'owner',
      createdDateTime: new Date().toISOString(),
    };
  } else {
    featureEditor = await db.getFeatureEditor(featureId, featureType, userId);
    // DynamoDB deletes expired items up to two days late.
    if (featureEditor?.ddb_ttl && featureEditor.ddb_ttl * 1000 < Date.now()) {
      featureEditor = null;
    }
  }

  if (!featureEditor && opts.shouldThrow) {
    throw new Error(`Forbidden: User is not an editor of this ${featureType}`);
  }
  return featureEditor;
};

export const canDeleteFeature = (editor: FeatureEditor | null) => editor?.reason === 'explicit';
