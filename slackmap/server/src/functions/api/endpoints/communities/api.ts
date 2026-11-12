import { slacklineDataApi } from '../../../../core/externalApi/slackline-data-api';
import countriesJson from '../../../../../data/countryInfoDict.json';
import { Feature, FeatureCollection, Geometry } from 'geojson';

import { Request } from '../../../http';
import { jsonRoute } from '../../utils';

export const getCountriesGeoJson = async () => {
  const isaMembers = await slacklineDataApi.getIsaMembersList();
  const slacklineGroupsGeoJson = await slacklineDataApi.getSlacklineGroupsGeoJson();

  const countryCodes = [
    ...isaMembers.map((member) => member.country),
    ...slacklineGroupsGeoJson.features.map((feature) => feature.properties?.c),
  ];

  const uniqueCountries = new Set(countryCodes.filter((code) => code));

  const countriesGeoJson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  for (const countryCode of uniqueCountries) {
    const countryInfo = countriesJson[countryCode as keyof typeof countriesJson];
    if (!countryInfo) {
      throw new Error(`Country: ${countryCode} not found in countryInfoDict.json`);
    }
    const feature: Feature = {
      type: 'Feature',
      properties: {
        id: countryCode,
        ft: 'comCt',
      },
      geometry: countryInfo.geometry as Geometry,
    };
    countriesGeoJson.features.push(feature);
  }

  return countriesGeoJson;
};

export const getCommunityCountryDetails = async (req: Request) => {
  const countryCode = req.params.code;
  const countryInfo = countriesJson[countryCode.toUpperCase() as keyof typeof countriesJson];

  const allSlacklineGroupsPromise = slacklineDataApi.getSlacklineGroups();
  const isaMembersPromise = slacklineDataApi.getIsaMembersList().then(async (members) => {
    const filtered = members.filter((member) => member.country === countryCode);
    return filtered;
  });
  const countryGroupIdsPromise = slacklineDataApi.getSlacklineGroupsGeoJson().then((geoJson) => {
    return geoJson.features
      .filter((feature) => feature.properties.c === countryCode)
      .map((feature) => feature.properties.id);
  });

  const [allSlacklineGroups, isaMembers, countryGroupIds] = await Promise.all([
    allSlacklineGroupsPromise,
    isaMembersPromise,
    countryGroupIdsPromise,
  ]);

  const slacklineGroups = allSlacklineGroups
    .filter((group) => countryGroupIds.includes(group.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { name: countryInfo.name, isaMembers, slacklineGroups };
};

export const getGroupDetails = async (req: Request) => {
  const groupId = req.params.groupId;

  const allSlacklineGroups = await slacklineDataApi.getSlacklineGroups();
  const groupInfo = allSlacklineGroups.find((group) => group.id === groupId);
  if (!groupInfo) {
    throw new Error(`NotFound: Group with id: ${groupId} not found`);
  }

  return { info: groupInfo };
};

export const communitiesRoutes = {
  'GET /communities/countriesGeoJson': jsonRoute(getCountriesGeoJson),
  'GET /communities/country/:code': jsonRoute(getCommunityCountryDetails),
  'GET /communities/group/:groupId': jsonRoute(getGroupDetails),
};
