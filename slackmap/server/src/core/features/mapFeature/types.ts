import { DDBGroupDetailTypes } from '../../db/entities/group/details/types';
import { DDBGuideDetailTypes } from '../../db/entities/guide/details/types';
import { DDBLineDetailTypes } from '../../db/entities/line/details/types';
import { DDBSpotDetailTypes } from '../../db/entities/spot/details/types';
import { MapFeatureChangelogAction, MapFeatureType } from '../../types';
import { FeatureCollection } from 'geojson';

export type GenericMapFeatureItemType =
  | DDBLineDetailTypes['Entity']
  | DDBSpotDetailTypes['Entity']
  | DDBGuideDetailTypes['Entity']
  | DDBGroupDetailTypes['Entity'];
export interface MapFeatureChangelog {
  featureId: string;
  featureType: MapFeatureType;
  userName: string;
  date: string;
  htmlText: string;
  actionType: MapFeatureChangelogAction;
}

export interface GenericMapFeature {
  type: MapFeatureType;
  id: string;
  geoJson: FeatureCollection;
  country: string;
  createdDateTime: string;
  creatorUserId?: string;
}
