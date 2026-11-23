import { DDBLineDetailTypes } from '../../../../core/db/entities/line/details/types';
import { LineActivation } from '../../../../core/db/entities/line/activation';
import { FeatureCollection } from 'geojson';

export const getLineDetailsResponse = (
  item: DDBLineDetailTypes['Entity'],
  editorPermissions?: {
    canDelete: boolean;
    canEdit: boolean;
  },
  activation?: LineActivation | null,
  activatedByName?: string,
) => {
  const isActive = activation && activation.until > Date.now() / 1000;
  return {
    id: item.lineId,
    geoJson: JSON.parse(item.geoJson) as FeatureCollection,
    name: item.name,
    description: item.description,
    createdDateTime: item.createdDateTime,
    lastModifiedDateTime: item.lastModifiedDateTime,
    type: item.type,
    creatorUserId: item.creatorUserId,
    length: item.length,
    height: item.height,
    accessInfo: item.accessInfo,
    anchorsInfo: item.anchorsInfo,
    gearInfo: item.gearInfo,
    contactInfo: item.contactInfo,
    restrictionLevel: item.restrictionLevel,
    extraInfo: item.extraInfo,
    restrictionInfo: item.restrictionInfo,
    isMeasured: item.isMeasured,
    anchorImages: item.anchorImages,
    images: item.images,
    editorPermissions,
    // Never the link hash.
    activation: isActive
      ? { until: activation.until, activatedAt: activation.activatedAt, activatedBy: activatedByName }
      : undefined,
  };
};
