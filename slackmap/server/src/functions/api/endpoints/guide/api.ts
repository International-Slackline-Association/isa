import { db } from '../../../../core/db';
import { DDBGuideDetailTypes } from '../../../../core/db/entities/guide/details/types';
import { processGuideGeoJson } from '../../../../core/features/geojson';
import { getCountryCodeOfGeoJson } from '../../../../core/features/geojson/utils';
import { validateGuideGeoJson } from '../../../../core/features/guide/validations';
import {
  addCreatedChangelogToFeature,
  addUpdatedDetailsChangelog,
} from '../../../../core/features/mapFeature/changelog';
import {
  canDeleteFeature,
  validateMapFeatureEditor,
} from '../../../../core/features/mapFeature/editors';
import { updateFeatureImagesInS3 } from '../../../../core/features/mapFeature/image';
import { GuideType } from '../../../../core/types';
import { assignFromSourceToTarget } from '../../../../core/utils';
import { logger } from '../../../../core/logger';
import { FeatureCollection, Geometry } from 'geojson';
import { nanoid } from 'nanoid';

import { Request } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';
import { getGuideDetailsResponse } from './dto';
import {
  createGuideSchema,
  updateGuideSchema,
} from './schema';

export const getGuideDetails = async (req: Request) => {
  const guide = await db.getGuideDetails(req.params.id);
  if (!guide) {
    throw new Error(`NotFound: Guide ${req.params.id} not found`);
  }
  const editPermission = await validateMapFeatureEditor(guide.guideId, 'guide', req.user?.isaId);

  return getGuideDetailsResponse(guide, {
    canDelete: canDeleteFeature(editPermission),
    canEdit: Boolean(editPermission),
  });
};
export const createGuide = async (req: Request) => {
  const requestClaims = verifyRequestClaims(req);
  const body = validateApiPayload(req.body, createGuideSchema);
  const geoJson = body.geoJson as unknown as FeatureCollection;

  if (!validateGuideGeoJson(geoJson as FeatureCollection<Geometry>)) {
    throw new Error('Validation: Invalid geoJson');
  }

  const guideId = nanoid(7);
  const countryCode = await getCountryCodeOfGeoJson(geoJson);

  const processedGeoJson = processGuideGeoJson(geoJson, {
    guideId,
    type: body.type as GuideType,
    country: countryCode,
  });

  const guideImages = await updateFeatureImagesInS3(guideId, body.images, {
    maxImageNumber: 2,
  });

  const guide: DDBGuideDetailTypes['Entity'] = {
    guideId,
    geoJson: JSON.stringify(processedGeoJson),
    description: body.description,
    type: body.type,
    creatorUserId: requestClaims.isaId,
    createdDateTime: new Date().toISOString(),
    lastModifiedDateTime: new Date().toISOString(),
    images: guideImages,
    country: countryCode,
  };
  await db.putGuide(guide);
  await addCreatedChangelogToFeature(guide, requestClaims.isaId, new Date());

  logger.info('created guide', { userId: req.user?.isaId, guideId });
  return getGuideDetailsResponse(guide);
};

export const updateGuide = async (req: Request) => {
  const requestClaims = verifyRequestClaims(req);

  const guideId = req.params.id;
  const body = validateApiPayload(req.body, updateGuideSchema);
  await validateMapFeatureEditor(guideId, 'guide', req.user?.isaId, { shouldThrow: true });

  const geoJson = body.geoJson as unknown as FeatureCollection;

  const guide = await db.getGuideDetails(guideId);
  if (!guide) {
    throw new Error('NotFound: Guide not found');
  }

  if (!validateGuideGeoJson(geoJson as FeatureCollection<Geometry>)) {
    throw new Error('Validation: Invalid geoJson');
  }

  const processedGeoJson = processGuideGeoJson(geoJson, {
    guideId,
    type: body.type as GuideType,
    country: guide.country,
  });

  const guideImages = await updateFeatureImagesInS3(guideId, body.images, {
    maxImageNumber: 2,
  });

  const payload = { ...req.body, images: guideImages, geoJson: JSON.stringify(processedGeoJson) };
  const updatedGuide = assignFromSourceToTarget(payload, guide);
  updatedGuide.lastModifiedDateTime = new Date().toISOString();
  await db.putGuide(updatedGuide);

  await addUpdatedDetailsChangelog(updatedGuide, guide, requestClaims.isaId, new Date());

  logger.info('updated guide', { userId: req.user?.isaId, guideId });
  return getGuideDetailsResponse(updatedGuide);
};

export const guideRoutes = {
  'POST /guide': jsonRoute(createGuide),
  'GET /guide/:id/details': jsonRoute(getGuideDetails),
  'PUT /guide/:id': jsonRoute(updateGuide),
};
