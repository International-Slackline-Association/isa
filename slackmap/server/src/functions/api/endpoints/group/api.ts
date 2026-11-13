import { db } from '../../../../core/db';
import { DDBGroupDetailTypes } from '../../../../core/db/entities/group/details/types';
import { processGroupGeoJson } from '../../../../core/features/geojson';
import { getCountryCodeOfGeoJson } from '../../../../core/features/geojson/utils';
import {
  validateGroupCountry,
  validateGroupGeoJson,
} from '../../../../core/features/group/validations';
import {
  addCreatedChangelogToFeature,
  addUpdatedDetailsChangelog,
  addUpdatedOwnersChangelog,
} from '../../../../core/features/mapFeature/changelog';
import {
  canDeleteFeature,
  isSlackmapAdmin,
  validateMapFeatureEditor,
} from '../../../../core/features/mapFeature/editors';
import { logger } from '../../../../core/logger';
import { FeatureCollection } from 'geojson';
import { nanoid } from 'nanoid';

import { Request } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';
import { getGroupDetailsResponse } from './dto';
import { CreateGroupPostBody, createGroupSchema, updateGroupSchema } from './schema';

type Group = DDBGroupDetailTypes['Entity'];

const groupFields = (body: CreateGroupPostBody) => ({
  name: body.name,
  email: body.email,
  facebookPage: body.facebookPage,
  facebookGroup: body.facebookGroup,
  instagram: body.instagram,
  telegram: body.telegram,
  whatsapp: body.whatsapp,
  webpage: body.webpage,
});

const membershipFields = (body: CreateGroupPostBody, userId: string, current?: Group) => {
  if (!isSlackmapAdmin(userId)) {
    const changed =
      (body.isaMemberType ?? current?.isaMemberType) !== current?.isaMemberType ||
      (body.isaMemberInfoUrl ?? current?.isaMemberInfoUrl) !== current?.isaMemberInfoUrl;
    if (changed) {
      throw new Error('Forbidden: Only ISA can change the membership of a group');
    }
    return { isaMemberType: current?.isaMemberType, isaMemberInfoUrl: current?.isaMemberInfoUrl };
  }
  return {
    isaMemberType: body.isaMemberType,
    isaMemberInfoUrl: body.isaMemberType ? body.isaMemberInfoUrl : undefined,
  };
};

const withoutUndefined = <T extends object>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

export const getGroupDetails = async (req: Request) => {
  const group = await db.getGroupDetails(req.params.id);
  if (!group) {
    throw new Error(`NotFound: Group ${req.params.id} not found`);
  }
  const userId = req.user?.isaId;
  const editor = await validateMapFeatureEditor(group.groupId, 'group', userId);

  return getGroupDetailsResponse(group, {
    canEdit: Boolean(editor),
    canDelete: canDeleteFeature(editor),
    canRequestEdit: Boolean(userId) && !editor && !group.isaMemberType,
    canManageMembership: isSlackmapAdmin(userId),
  });
};

export const createGroup = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const body = validateApiPayload(req.body, createGroupSchema);
  const geoJson = body.geoJson as unknown as FeatureCollection;
  validateGroupGeoJson(geoJson);

  const groupId = nanoid(7);
  const country = validateGroupCountry(await getCountryCodeOfGeoJson(geoJson));
  const now = new Date().toISOString();

  const group: Group = withoutUndefined({
    groupId,
    country,
    geoJson: JSON.stringify(processGroupGeoJson(geoJson, { groupId })),
    ...groupFields(body),
    ...membershipFields(body, isaId),
    creatorUserId: isaId,
    createdDateTime: now,
    lastModifiedDateTime: now,
  });
  await db.putGroup(group);
  await addCreatedChangelogToFeature(group, isaId, new Date());

  logger.info('created group', { userId: isaId, groupId });
  return getGroupDetailsResponse(group);
};

export const updateGroup = async (req: Request) => {
  const { isaId } = verifyRequestClaims(req);
  const groupId = req.params.id;
  const body = validateApiPayload(req.body, updateGroupSchema);
  await validateMapFeatureEditor(groupId, 'group', isaId, { shouldThrow: true });

  const group = await db.getGroupDetails(groupId);
  if (!group) {
    throw new Error('NotFound: Group not found');
  }
  const geoJson = body.geoJson as unknown as FeatureCollection;
  validateGroupGeoJson(geoJson);

  const processedGeoJson = JSON.stringify(processGroupGeoJson(geoJson, { groupId }));
  const country =
    processedGeoJson === group.geoJson
      ? group.country
      : validateGroupCountry(await getCountryCodeOfGeoJson(geoJson));

  const updatedGroup: Group = withoutUndefined({
    groupId,
    country,
    geoJson: processedGeoJson,
    ...groupFields(body),
    ...membershipFields(body, isaId, group),
    creatorUserId: group.creatorUserId,
    createdDateTime: group.createdDateTime,
    lastModifiedDateTime: new Date().toISOString(),
  });
  await db.putGroup(updatedGroup);
  await addUpdatedDetailsChangelog(updatedGroup, group, isaId, new Date());

  if (updatedGroup.isaMemberType && !group.isaMemberType) {
    await db.deleteAllFeatureEditors(groupId, 'group');
    await addUpdatedOwnersChangelog(updatedGroup, isaId, new Date());
  }

  logger.info('updated group', { userId: isaId, groupId });
  return getGroupDetailsResponse(updatedGroup);
};

export const groupRoutes = {
  'POST /group': jsonRoute(createGroup),
  'GET /group/:id/details': jsonRoute(getGroupDetails),
  'PUT /group/:id': jsonRoute(updateGroup),
};
