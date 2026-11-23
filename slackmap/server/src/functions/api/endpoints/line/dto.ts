import { DDBLineDetailTypes } from '../../../../core/db/entities/line/details/types';
import { LineRig } from '../../../../core/db/entities/line/rig';
import { FeatureCollection } from 'geojson';

export const getLineDetailsResponse = (
  item: DDBLineDetailTypes['Entity'],
  editorPermissions?: {
    canDelete: boolean;
    canEdit: boolean;
  },
  rig?: LineRig | null,
) => {
  const isRigged = rig && rig.until > Date.now() / 1000;
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
    rig: isRigged ? { until: rig.until, reportedAt: rig.reportedAt } : undefined,
  };
};
