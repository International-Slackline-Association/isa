import { DDBSpotDetailTypes } from '../../../../core/db/entities/spot/details/types';
import { FeatureCollection } from 'geojson';
import { PublicActivation, PublicActivationDates } from '../../../../core/features/activation';

export const getSpotDetailsResponse = (
  item: DDBSpotDetailTypes['Entity'],
  editorPermissions?: {
    canDelete: boolean;
    canEdit: boolean;
  },
  activation?: PublicActivation,
  activationDates?: PublicActivationDates,
) => {
  return {
    id: item.spotId,
    geoJson: JSON.parse(item.geoJson) as FeatureCollection,
    name: item.name,
    description: item.description,
    types: item.types,
    createdDateTime: item.createdDateTime,
    lastModifiedDateTime: item.lastModifiedDateTime,
    creatorUserId: item.creatorUserId,
    accessInfo: item.accessInfo,
    contactInfo: item.contactInfo,
    restrictionLevel: item.restrictionLevel,
    extraInfo: item.extraInfo,
    restrictionInfo: item.restrictionInfo,
    images: item.images,
    editorPermissions,
    activation,
    activationDates,
  };
};
