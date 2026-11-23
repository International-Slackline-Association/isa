import { useSyncExternalStore } from 'react';

import { featureCollection } from '@turf/turf';
import { Feature, FeatureCollection, Point } from 'geojson';

import { ensureSession, showSessionFailure } from 'app/session';

import { geoJsonURL } from './constants';

export type MapDataKind = 'features' | 'groups';

// The file the server's stream handler rewrites last for each kind, so once it changes the whole set is new.
const lastRewrittenFile: Record<MapDataKind, string> = {
  features: geoJsonURL.countryPoints,
  groups: geoJsonURL.communityCountries,
};
const pollEveryMs = 1500;
const giveUpAfterMs = 30_000;

const versions: Record<MapDataKind, number> = { features: 0, groups: 0 };
const listeners = new Set<() => void>();

export const useMapDataVersion = (kind: MapDataKind) =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => versions[kind],
  );

// A new URL is what makes the map fetch a source again.
export const versionedUrl = (url: string, version: number) => (version ? `${url}?v=${version}` : url);

const lastModified = async (kind: MapDataKind) => {
  await ensureSession();
  const response = await fetch(lastRewrittenFile[kind], { method: 'HEAD', credentials: 'include', cache: 'no-store' });
  return response.headers.get('last-modified');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The server rebuilds the map files a few seconds after a write, so the map reloads when they change.
// Other people's writes rebuild the same files and one of them can land first, so it keeps watching
// for the whole window; a write the server does not rebuild for (a name edit) just ends it quietly.
export const reloadMapDataAfterWrite = async (kind: MapDataKind, write: Promise<unknown>) => {
  try {
    let seen = await lastModified(kind);
    await write;
    for (let waited = 0; waited < giveUpAfterMs; waited += pollEveryMs) {
      await sleep(pollEveryMs);
      const current = await lastModified(kind);
      if (current === seen) continue;
      seen = current;
      if (kind === 'features') {
        cache.allSlacklinePoints = undefined;
        cache.countrySlacklinePoints = undefined;
        cache.slacklinePointFeaturesOfCountry = {};
      } else {
        cache.slacklineGroups = undefined;
      }
      versions[kind] += 1;
      listeners.forEach((listener) => listener());
    }
  } catch (error) {
    // A failed write is reported by its own request.
    console.warn('Map data not reloaded', kind, error);
  }
};

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

const isActivatable = (ft: unknown) => ft === 'l' || ft === 's';

export const getActivePoints = async () => {
  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const nowSeconds = Date.now() / 1000;
  return allPointsGeoJson.features
    .filter((f) => isActivatable(f.properties?.ft) && f.properties?.au > nowSeconds)
    .map((f) => ({
      id: f.properties!.id as string,
      type: (f.properties!.ft === 's' ? 'spot' : 'line') as 'line' | 'spot',
      activeUntil: f.properties!.au as number,
      length: f.properties!.l as string | undefined,
      country: f.properties!.c as string | undefined,
      center: (f.geometry as Point).coordinates,
    }))
    .sort((a, b) => a.activeUntil - b.activeUntil);
};

export const getSlacklineMapStats = async () => {
  const allPointsGeoJson = await getAllSlacklinePointsGeoJson();
  const featureStats = getSlacklineFeatureStats(allPointsGeoJson);
  const countryCount = await getCountrySlacklinePointsGeoJson();
  const nowSeconds = Date.now() / 1000;
  const activeCount = allPointsGeoJson.features.filter(
    (feature) => isActivatable(feature.properties?.ft) && feature.properties?.au > nowSeconds,
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
