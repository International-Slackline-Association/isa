import { db } from '../../core/db';
import { groupDetailsDB } from '../../core/db/entities/group/details';
import { DDBGroupDetailTypes } from '../../core/db/entities/group/details/types';
import { DDBAttributeItem } from '../../core/db/utils/types';
import { refreshGroupGeoJsonFiles } from '../../core/features/geojson';
import { checkUserExists } from '../../core/features/isaUser';
import { logger } from '../../core/logger';

export const processGroupDetailsOperation = async (
  newItem: DDBAttributeItem | undefined,
  oldItem: DDBAttributeItem | undefined,
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE' | undefined,
) => {
  const newGroup =
    newItem && groupDetailsDB.converter.itemToEntity(newItem as DDBGroupDetailTypes['Item']);
  const oldGroup =
    oldItem && groupDetailsDB.converter.itemToEntity(oldItem as DDBGroupDetailTypes['Item']);

  if (eventName === 'INSERT' && newGroup) {
    await refreshGroupGeoJsonFiles({ group: newGroup });
    logger.info('published groups', { groupId: newGroup.groupId });
    if (newGroup.creatorUserId) {
      await checkUserExists(newGroup.creatorUserId);
      await db.putFeatureEditor({
        featureId: newGroup.groupId,
        featureType: 'group',
        userId: newGroup.creatorUserId,
        createdDateTime: new Date().toISOString(),
        reason: 'explicit',
        type: 'owner',
      });
      logger.info('added group owner', { groupId: newGroup.groupId, userId: newGroup.creatorUserId });
    }
  }

  if (eventName === 'MODIFY' && newGroup && oldGroup) {
    if (
      oldGroup.geoJson !== newGroup.geoJson ||
      oldGroup.country !== newGroup.country ||
      oldGroup.isaMemberType !== newGroup.isaMemberType
    ) {
      await refreshGroupGeoJsonFiles({ group: newGroup });
      logger.info('published groups', { groupId: newGroup.groupId });
    }
  }

  if (eventName === 'REMOVE' && oldGroup) {
    await db.deleteAllFeatureEditors(oldGroup.groupId, 'group');
    await db.deleteAllFeatureChangelogs(oldGroup.groupId, 'group');
    logger.info('deleted group editors and changelogs', { groupId: oldGroup.groupId });
    await refreshGroupGeoJsonFiles({ removedGroupId: oldGroup.groupId });
    logger.info('published groups', { groupId: oldGroup.groupId });
  }
};
