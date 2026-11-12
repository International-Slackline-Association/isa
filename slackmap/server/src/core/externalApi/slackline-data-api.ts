import { SimpleCache } from '../utils/cache';
import { FeatureCollection, Geometry } from 'geojson';

const baseUrl =
  'https://raw.githubusercontent.com/International-Slackline-Association/slackline-data/master/data';

const getJson = async <T>(path: string) => {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status code ${response.status}`);
  }
  return (await response.json()) as T;
};

export interface IsaMember {
  country: string;
  name: string;
  joinedDate?: string;
  email: string;
  infoUrl?: string;
  groupId?: string;
  memberType: 'national' | 'observer' | 'partner' | 'associate';
  profilePictureUrl?: string;
}

export interface SlacklineGroupGeoJsonProperties {
  id: string;
  ft: 'sg';
  c: string; // country
}

export interface SlacklineGroup {
  id: string;
  name: string;
  createdDateTime: string; // only date
  updatedDateTime: string; // only date
  email?: string;
  facebookPage?: string;
  facebookGroup?: string;
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
  webpage?: string;
}

const isaMembersCache = new SimpleCache<IsaMember[]>(5);
const slacklineGroupsGeoJsonCache = new SimpleCache<
  FeatureCollection<Geometry, SlacklineGroupGeoJsonProperties>
>(5);
const slacklineGroupsCache = new SimpleCache<SlacklineGroup[]>(5);

const getIsaMembersList = async () => {
  const cache = isaMembersCache.get();
  if (cache) return cache;

  const members = await getJson<IsaMember[]>(`/communities/isa/members.json`);
  isaMembersCache.set(undefined, members);

  return members;
};

const getSlacklineGroupsGeoJson = async () => {
  const cache = slacklineGroupsGeoJsonCache.get();
  if (cache) return cache;

  const geoJson = await getJson<FeatureCollection<Geometry, SlacklineGroupGeoJsonProperties>>(
    `/communities/groups/groups.geojson`,
  );
  slacklineGroupsGeoJsonCache.set(undefined, geoJson);

  return geoJson;
};

const getSlacklineGroups = async () => {
  const cache = slacklineGroupsCache.get();
  if (cache) return cache;

  const groups = await getJson<SlacklineGroup[]>(`/communities/groups/groups.json`);
  slacklineGroupsCache.set(undefined, groups);

  return groups;
};

export const slacklineDataApi = {
  getIsaMembersList,
  getSlacklineGroupsGeoJson,
  getSlacklineGroups,
};
