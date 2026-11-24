import * as turf from '@turf/turf';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { featureCollection } from '@turf/turf';
import { s3 } from '../../aws/clients';
import { db } from '../../db';
import { FeatureActivation } from '../../db/entities/activation';
import { DDBGroupDetailTypes } from '../../db/entities/group/details/types';
import { GuideType, SlacklineType, SpotType } from '../../types';
import countriesJson from '../../../../data/countryInfoDict.json';
import { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import zlib from 'zlib';

import { logger } from '../../logger';
import { webUrl } from '../../domain';

import { guideTypeLabel } from '../guide';
import { calculateCenterOfFeature, optimizeGeoJsonFeature } from './utils';

export const processLineGeoJson = (
  geoJson: FeatureCollection,
  meta: {
    lineId: string;
    type?: SlacklineType;
    length?: number;
    country: string;
    activation?: MapActivation;
  },
): FeatureCollection => {
  const features: Feature[] = [];
  for (const feature of geoJson.features) {
    const f = optimizeGeoJsonFeature(feature);
    delete f['id'];
    f.properties = f.properties || {};
    f.properties['id'] = meta.lineId;
    f.properties['ft'] = 'l';
    f.properties['l'] = meta.length && `${meta.length.toFixed(1)}m`;
    if (meta.type && meta.type !== 'other') {
      f.properties['lt'] = meta.type?.substring(0, 1);
    }
    if (meta.country) {
      f.properties['c'] = meta.country;
    }
    setActivationProperties(f.properties, meta.activation);
    features.push(f);
  }

  return { type: 'FeatureCollection', features };
};

type MapActivation = { from: number; until: number; activatedAt: number };

// Only for the map files; a feature's stored geoJson never carries it. The hourly job rewrites the files when one starts.
const setActivationProperties = (properties: Record<string, any>, activation?: MapActivation) => {
  if (activation && activation.from <= Date.now() / 1000) {
    properties['au'] = activation.until;
    properties['aa'] = activation.activatedAt;
  } else {
    delete properties['au'];
    delete properties['aa'];
  }
};

export const processSpotGeoJson = (
  geoJson: FeatureCollection,
  meta: {
    spotId: string;
    types?: SpotType[];
    country: string;
    activation?: MapActivation;
  },
): FeatureCollection => {
  const features: Feature[] = [];
  for (const feature of geoJson.features) {
    const f = optimizeGeoJsonFeature(feature);
    delete f['id'];
    f.properties = f.properties || {};
    f.properties['id'] = meta.spotId;
    f.properties['ft'] = 's';
    delete f.properties['st'];
    if (meta.types?.length) {
      f.properties['st'] = meta.types.map((t) => t.substring(0, 1)).join('');
    }
    if (meta.country) {
      f.properties['c'] = meta.country;
    }
    setActivationProperties(f.properties, meta.activation);
    features.push(f);
  }
  return { type: 'FeatureCollection', features };
};

export const processGuideGeoJson = (
  geoJson: FeatureCollection,
  meta: {
    guideId: string;
    type?: GuideType;
    country: string;
  },
): FeatureCollection => {
  const features: Feature[] = [];
  for (const feature of geoJson.features) {
    const f = optimizeGeoJsonFeature(feature);
    delete f['id'];
    f.properties = f.properties || {};
    f.properties['id'] = meta.guideId;
    f.properties['ft'] = 'g';
    f.properties['l'] = meta.type && guideTypeLabel(meta.type);
    if (meta.country) {
      f.properties['c'] = meta.country;
    }
    features.push(f);
  }

  return { type: 'FeatureCollection', features };
};

// Only the point is kept: anything else a client sends would be stored and published.
export const processGroupGeoJson = (
  geoJson: FeatureCollection,
  meta: { groupId: string },
): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: geoJson.features.map((feature) =>
    optimizeGeoJsonFeature({
      type: 'Feature',
      properties: { id: meta.groupId },
      geometry: { type: 'Point', coordinates: (feature.geometry as Point).coordinates.slice(0, 2) },
    } as Feature<Point>),
  ),
});

// The map colours a group by 'ft': 'sg' a slackline group, 'isaM' a group ISA recognizes.
export const groupMapGeoJson = (group: DDBGroupDetailTypes['Entity']): FeatureCollection<Point> => {
  const geoJson = JSON.parse(group.geoJson) as FeatureCollection<Point>;
  return {
    type: 'FeatureCollection',
    features: geoJson.features.map((f) => ({
      type: 'Feature',
      properties: { id: group.groupId, ft: group.isaMemberType ? 'isaM' : 'sg', c: group.country },
      geometry: { type: 'Point', coordinates: f.geometry.coordinates },
    })),
  };
};

// Always rebuilt whole: about 1.5k small items, and no lost update between parallel stream records.
// The index read may miss the write that triggered it, so the changed group is passed in.
export const refreshGroupGeoJsonFiles = async (
  changed?: { group?: DDBGroupDetailTypes['Entity']; removedGroupId?: string },
) => {
  const changedId = changed?.group?.groupId ?? changed?.removedGroupId;
  const groups = (await db.getAllGroups()).filter((g) => g.groupId !== changedId);
  if (changed?.group) groups.push(changed.group);

  const pointsGeoJSON = featureCollection(groups.flatMap((g) => groupMapGeoJson(g).features));
  await writeToS3('geojson/groups/points.geojson', pointsGeoJSON);

  const countriesGeoJSON: FeatureCollection = { type: 'FeatureCollection', features: [] };
  for (const code of new Set(groups.map((g) => g.country))) {
    const countryInfo = countriesJson[code as keyof typeof countriesJson];
    if (!countryInfo) {
      logger.error('Group country not in countryInfoDict.json', { country: code });
      continue;
    }
    countriesGeoJSON.features.push({
      type: 'Feature',
      properties: { id: code, ft: 'comCt' },
      geometry: countryInfo.geometry as Geometry,
    });
  }
  await writeToS3('geojson/groups/countries.geojson', countriesGeoJSON);
  return { groupCount: groups.length };
};

export const refreshLineGeoJsonFiles = async (
  opts: {
    lineIdToUpdate?: string;
  } = {},
) => {
  let mainGeoJSON: FeatureCollection;
  let updatedLines: Awaited<ReturnType<typeof db.getAllLines>> | undefined;

  if (opts.lineIdToUpdate) {
    const [line, activation] = await Promise.all([
      db.getLineDetails(opts.lineIdToUpdate),
      db.getActivation('line', opts.lineIdToUpdate),
    ]);
    mainGeoJSON = await getFromS3('geojson/lines/all.geojson');
    mainGeoJSON.features = mainGeoJSON.features.filter(
      (f) => f.properties?.id !== opts.lineIdToUpdate,
    );
    if (line) {
      const geoJson = processLineGeoJson(JSON.parse(line.geoJson), {
        lineId: line.lineId,
        type: line.type,
        length: line.length,
        country: line.country,
        activation: activation ?? undefined,
      });
      mainGeoJSON.features.push(...geoJson.features);
      updatedLines = [line];
    }
  } else {
    mainGeoJSON = {
      type: 'FeatureCollection',
      features: [],
    };
    updatedLines = await db.getAllLines();
    const activations = new Map((await db.getAllActivations('line')).map((a) => [a.featureId, a]));
    for (const line of updatedLines) {
      if (line) {
        const geoJson = processLineGeoJson(JSON.parse(line.geoJson), {
          lineId: line.lineId,
          type: line.type,
          length: line.length,
          country: line.country,
          activation: activations.get(line.lineId),
        });
        for (const feature of geoJson.features) {
          mainGeoJSON.features.push(feature);
        }
      }
    }
  }

  await writeToS3('geojson/lines/all.geojson', mainGeoJSON);
  const pointsGeoJSON = generatePointsGeoJson(mainGeoJSON);
  await writeToS3('geojson/lines/points.geojson', pointsGeoJSON);
  await refreshClusterPointsGeoJsonFiles({ linePoints: pointsGeoJSON });
  await refreshActiveGeoJsonFile();
  return { mainGeoJSON, pointsGeoJSON, updatedLines };
};

export const refreshSpotGeoJsonFiles = async (
  opts: {
    spotIdToUpdate?: string;
  } = {},
) => {
  let mainGeoJSON: FeatureCollection;
  let updatedSpots: Awaited<ReturnType<typeof db.getAllSpots>> | undefined;

  if (opts.spotIdToUpdate) {
    const [spot, activation] = await Promise.all([
      db.getSpotDetails(opts.spotIdToUpdate),
      db.getActivation('spot', opts.spotIdToUpdate),
    ]);
    mainGeoJSON = await getFromS3('geojson/spots/all.geojson');
    mainGeoJSON.features = mainGeoJSON.features.filter(
      (f) => f.properties?.id !== opts.spotIdToUpdate,
    );
    if (spot) {
      const geoJson = processSpotGeoJson(JSON.parse(spot.geoJson), {
        spotId: spot.spotId,
        types: spot.types,
        country: spot.country,
        activation: activation ?? undefined,
      });
      mainGeoJSON.features.push(...geoJson.features);
      updatedSpots = [spot];
    }
  } else {
    mainGeoJSON = {
      type: 'FeatureCollection',
      features: [],
    };
    updatedSpots = await db.getAllSpots();
    const activations = new Map((await db.getAllActivations('spot')).map((a) => [a.featureId, a]));
    for (const spot of updatedSpots) {
      if (spot) {
        const geoJson = processSpotGeoJson(JSON.parse(spot.geoJson), {
          spotId: spot.spotId,
          types: spot.types,
          country: spot.country,
          activation: activations.get(spot.spotId),
        });
        for (const feature of geoJson.features) {
          mainGeoJSON.features.push(feature);
        }
      }
    }
  }

  await writeToS3('geojson/spots/all.geojson', mainGeoJSON);
  const pointsGeoJSON = generatePointsGeoJson(mainGeoJSON);
  await writeToS3('geojson/spots/points.geojson', pointsGeoJSON);
  await refreshClusterPointsGeoJsonFiles({ spotPoints: pointsGeoJSON });
  await refreshActiveGeoJsonFile();
  return { mainGeoJSON, pointsGeoJSON, updatedSpots };
};

export const refreshGuideGeoJsonFiles = async (
  opts: {
    guideIdToUpdate?: string;
  } = {},
) => {
  let mainGeoJSON: FeatureCollection;
  let updatedGuides: Awaited<ReturnType<typeof db.getAllGuides>> | undefined;

  if (opts.guideIdToUpdate) {
    const guide = await db.getGuideDetails(opts.guideIdToUpdate);
    mainGeoJSON = await getFromS3('geojson/guides/all.geojson');
    mainGeoJSON.features = mainGeoJSON.features.filter(
      (f) => f.properties?.id !== opts.guideIdToUpdate,
    );
    if (guide) {
      const geoJson = processGuideGeoJson(JSON.parse(guide.geoJson), {
        guideId: guide.guideId,
        type: guide.type,
        country: guide.country,
      });
      mainGeoJSON.features.push(...geoJson.features);
      updatedGuides = [guide];
    }
  } else {
    mainGeoJSON = {
      type: 'FeatureCollection',
      features: [],
    };
    updatedGuides = await db.getAllGuides();
    for (const guide of updatedGuides) {
      if (guide) {
        const geoJson = processGuideGeoJson(JSON.parse(guide.geoJson), {
          guideId: guide.guideId,
          type: guide.type,
          country: guide.country,
        });
        for (const feature of geoJson.features) {
          mainGeoJSON.features.push(feature);
        }
      }
    }
  }

  await writeToS3('geojson/guides/all.geojson', mainGeoJSON);
  const pointsGeoJSON = generatePointsGeoJson(mainGeoJSON);
  await writeToS3('geojson/guides/points.geojson', pointsGeoJSON);
  await refreshClusterPointsGeoJsonFiles({ guidePoints: pointsGeoJSON });
  return { mainGeoJSON, pointsGeoJSON, updatedGuides };
};

const refreshClusterPointsGeoJsonFiles = async (
  opts: {
    linePoints?: FeatureCollection;
    spotPoints?: FeatureCollection;
    guidePoints?: FeatureCollection;
  } = {},
) => {
  const linesPointGeoJSON = opts.linePoints || (await getFromS3('geojson/lines/points.geojson'));
  const spotsPointGeoJSON = opts.spotPoints || (await getFromS3('geojson/spots/points.geojson'));
  const guidesPointGeoJSON = opts.guidePoints || (await getFromS3('geojson/guides/points.geojson'));

  const allPoints = featureCollection([
    ...linesPointGeoJSON.features,
    ...spotsPointGeoJSON.features,
    ...guidesPointGeoJSON.features,
  ]);

  await writeToS3('geojson/clusters/all.geojson', allPoints);
  await refreshCountryPointsGeoJson({ allPoints });
  return { allPoints };
};

const refreshCountryPointsGeoJson = async (opts: { allPoints?: FeatureCollection }) => {
  const allPointsGeoJson = opts.allPoints || (await getFromS3('geojson/clusters/all.geojson'));

  const countriesHavingFeatures = new Set<string>();
  turf.propEach(allPointsGeoJson, (currentProp) => {
    const countryId = currentProp?.['c'];
    if (countryId) {
      countriesHavingFeatures.add(countryId);
    }
  });

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  for (const code of countriesHavingFeatures) {
    const countryInfo = countriesJson[code as keyof typeof countriesJson];
    if (!countryInfo) {
      throw new Error(`Country ${code} not found in countries.json`);
    }
    geojson.features.push({
      type: 'Feature',
      properties: {
        name: countryInfo.name,
        id: code,
        ft: 'ct',
      },
      geometry: countryInfo.geometry as Geometry,
    });
  }

  await writeToS3('geojson/countries/points.geojson', geojson);
};

const generatePointsGeoJson = (geoJson: FeatureCollection) => {
  const pointsGeoJson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  const exisitingIds: string[] = [];
  turf.featureEach(geoJson, (feature) => {
    const id = feature.properties?.id as string;
    if (exisitingIds.includes(id)) {
      return;
    }
    const pointFeature = generatePointFeature(feature);
    pointsGeoJson.features.push(pointFeature);
    exisitingIds.push(id);
  });
  return pointsGeoJson;
};

const generatePointFeature = (feature: Feature) => {
  const coordinates = calculateCenterOfFeature(feature);
  const newFeature: Feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: feature.properties,
  };
  return newFeature;
};

const isoOf = (seconds: number) => new Date(seconds * 1000).toISOString();

const activeFeatureOf = async (activation: FeatureActivation): Promise<Feature | undefined> => {
  const { featureType, featureId } = activation;
  const line = featureType === 'line' ? await db.getLineDetails(featureId) : undefined;
  const details = line ?? (featureType === 'spot' ? await db.getSpotDetails(featureId) : undefined);
  if (!details) return undefined;
  const geometry = (JSON.parse(details.geoJson) as FeatureCollection).features[0]?.geometry as Geometry | undefined;
  if (!geometry) return undefined;
  return {
    type: 'Feature',
    geometry,
    properties: {
      id: featureId,
      type: featureType,
      name: details.name || null,
      lineType: line?.type ?? null,
      length: line?.length ?? null,
      height: line?.height ?? null,
      country: details.country,
      activeFrom: isoOf(activation.from),
      activeUntil: isoOf(activation.until),
      activatedAt: isoOf(activation.activatedAt),
      // Never who: an activation with a name only says it has one.
      anonymous: !activation.activatedBy,
      url: `${webUrl}/${featureType}/${featureId}`,
    },
  };
};

// For partners: the active lines and spots with readable fields, as the map shows them.
export const refreshActiveGeoJsonFile = async () => {
  const now = Math.floor(Date.now() / 1000);
  const all = [...(await db.getAllActivations('line')), ...(await db.getAllActivations('spot'))];
  const active = all.filter((a) => a.from <= now && a.until > now);
  const features = (await Promise.all(active.map(activeFeatureOf))).filter(Boolean) as Feature[];
  await writeToS3('geojson/active.geojson', { type: 'FeatureCollection', features });
};

const writeToS3 = async (key: string, geoJson: FeatureCollection) => {
  const body = zlib.gzipSync(JSON.stringify(geoJson));

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.SLACKMAP_APPLICATION_DATA_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: 'public, no-cache',
      ContentEncoding: 'gzip',
    }),
  );
};

export const getFromS3 = async (key: string) => {
  const s3Image = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.SLACKMAP_APPLICATION_DATA_S3_BUCKET,
      Key: key,
    }),
  );

  const streamToString = await s3Image.Body!.transformToString('base64');
  const body = zlib.gunzipSync(Buffer.from(streamToString, 'base64')).toString('utf-8');

  if (!body) {
    throw new Error('Could not get geojson from S3');
  }
  return JSON.parse(body) as FeatureCollection;
};
