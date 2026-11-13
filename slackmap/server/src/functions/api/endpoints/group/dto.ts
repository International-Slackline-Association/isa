import { DDBGroupDetailTypes } from '../../../../core/db/entities/group/details/types';
import { groupMapGeoJson } from '../../../../core/features/geojson';

export const groupResponse = (item: DDBGroupDetailTypes['Entity']) => ({
  id: item.groupId,
  name: item.name,
  country: item.country,
  geoJson: groupMapGeoJson(item),
  email: item.email,
  facebookPage: item.facebookPage,
  facebookGroup: item.facebookGroup,
  instagram: item.instagram,
  telegram: item.telegram,
  whatsapp: item.whatsapp,
  webpage: item.webpage,
  isaMembership: item.isaMemberType
    ? { type: item.isaMemberType, infoUrl: item.isaMemberInfoUrl }
    : undefined,
  creatorUserId: item.creatorUserId,
  createdDateTime: item.createdDateTime,
  lastModifiedDateTime: item.lastModifiedDateTime,
});

export const getGroupDetailsResponse = (
  item: DDBGroupDetailTypes['Entity'],
  editorPermissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canRequestEdit: boolean;
    canManageMembership: boolean;
  },
) => ({ ...groupResponse(item), editorPermissions });
