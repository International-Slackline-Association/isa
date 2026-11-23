import { featureCollection } from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';

import { ensureSession, showSessionFailure } from 'app/session';

import { geoJsonURL } from './constants';

const cache = {
  allSlacklinePoints: undefined as FeatureCollection | undefined,
  countrySlacklinePoints: undefined as FeatureCollection | undefined,
  slacklineGroups: undefined as FeatureCollection | undefined,
  countryPolygons: {} as { [key: string]: Feature },
  slacklinePointFeaturesOfCountry: {} as {
    [key: string]: {
      geoJson: FeatureCollection;
      stats: { lineCount: number; spotCount: number; guideCount: number };
    };
  },
};

const fetchCache = async (
  url: string,
  key: 'allSlacklinePoints' | 'countrySlacklinePoints' | 'slacklineGroups',
): Promise<FeatureCollection> => {
  if (!cache[key]) {
    await ensureSession();
    let response = await fetch(url, { credentials: 'include' });
    if (response.status === 403) {
      await ensureSession(true);
      response = await fetch(url, { credentials: 'include' });
      if (response.status === 403) showSessionFailure();
    }
    cache[key] = await response.json();
  }
  return cache[key]!;
};

const getCountrySlacklinePointsGeoJson = async () => {
  return fetchCache(geoJsonURL.countryPoints, 'countrySlacklinePoints');
};

const getAllSlacklinePointsGeoJson = async () => {
  return fetchCache(geoJsonURL.clustersAll, 'allSlacklinePoints');
};

const getSlacklineGroupsGeoJson = async () => {
  return fetchCache(geoJsonURL.groups, 'slacklineGroups');
};

const getSlacklineFeatureStats = (geoJson: FeatureCollection) => {
  let lineCount = 0;
  let spotCount = 0;
  let guideCount = 0;

  for (const feature of geoJson.features) {
    if (feature.properties?.['ft'] === 'l') {
      lineCount++;
    } else if (feature.properties?.['ft'] === 's') {
      spotCount++;
    } else if (feature.properties?.['ft'] === 'g') {
      guideCount++;
    }
  }
  return {
    lineCount,
    spotCount,
    guideCount,
  };
};

export const getSlacklinePointOfFeature = async (id: string) => {
  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const feature = allPointsGeoJson.features.find((f) => f.properties?.id === id);
  return feature?.geometry.type === 'Point' ? feature.geometry.coordinates : undefined;
};

export const getSlacklinePointFeaturesOfCountry = async (code: string) => {
  if (cache.slacklinePointFeaturesOfCountry[code]?.geoJson) {
    return cache.slacklinePointFeaturesOfCountry[code];
  }

  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const filteredFeatures = allPointsGeoJson.features.filter(
    (feature) => feature.properties?.c === code,
  );

  cache.slacklinePointFeaturesOfCountry[code] = {
    geoJson: featureCollection(filteredFeatures),
    stats: getSlacklineFeatureStats(featureCollection(filteredFeatures)),
  };
  return cache.slacklinePointFeaturesOfCountry[code];
};

// Lines whose 'au' (active until, epoch seconds) is still ahead.
export const getActiveLinePoints = async () => {
  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const nowSeconds = Date.now() / 1000;
  return allPointsGeoJson.features
    .filter((f) => f.properties?.ft === 'l' && f.properties?.au > nowSeconds)
    .map((f) => ({
      id: f.properties!.id as string,
      activeUntil: f.properties!.au as number,
      length: f.properties!.l as string | undefined,
      country: f.properties!.c as string | undefined,
    }))
    .sort((a, b) => a.activeUntil - b.activeUntil);
};

export const getSlacklineMapStats = async () => {
  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const featureStats = getSlacklineFeatureStats(allPointsGeoJson);
  const countryCount = await getCountrySlacklinePointsGeoJson();
  const nowSeconds = Date.now() / 1000;
  const activeCount = allPointsGeoJson.features.filter(
    (feature) => feature.properties?.ft === 'l' && feature.properties?.au > nowSeconds,
  ).length;
  return {
    ...featureStats,
    activeCount,
    countryCount: countryCount.features.length,
  };
};

export const getSlacklineGroupsGeoJsonOfCountry = async (code: string) => {
  const slacklineGroupGeoJson = await getSlacklineGroupsGeoJson();
  const filteredGroups = slacklineGroupGeoJson.features.filter(
    (feature) => feature.properties?.c === code,
  );

  return { geoJson: featureCollection(filteredGroups) };
};

export const getCommunityMapStats = async () => {
  const slacklineGroupGeoJson = await getSlacklineGroupsGeoJson();

  const slacklineGroupsCount = slacklineGroupGeoJson.features.filter(
    (feature) => feature.properties?.ft === 'sg',
  ).length;

  const isaMembersCount = slacklineGroupGeoJson.features.filter(
    (feature) => feature.properties?.ft === 'isaM',
  ).length;

  const countryCount = new Set(
    slacklineGroupGeoJson.features.map((feature) => feature.properties?.c),
  ).size;

  return { slacklineGroupsCount, isaMembersCount, countryCount };
};
