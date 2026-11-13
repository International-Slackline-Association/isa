import { DDBGenericItemTypes } from '../../../utils/types';
import { IsaMemberType } from '../../../../types';

type PrimaryKeyAttrs = {
  groupId: string;
};

type IndexedKeyAttrs = {
  country: string;
};

type NonKeyAttrs = {
  name: string;
  // Groups imported from slackline-data have no creator.
  creatorUserId?: string;
  geoJson: string; // Always FeatureCollection type with one Point
  email?: string;
  facebookPage?: string;
  facebookGroup?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  webpage?: string;
  isaMemberType?: IsaMemberType;
  isaMemberInfoUrl?: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
};

export type DDBGroupDetailTypes = DDBGenericItemTypes<
  PrimaryKeyAttrs,
  IndexedKeyAttrs,
  NonKeyAttrs
>;
