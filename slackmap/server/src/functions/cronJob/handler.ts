import { refreshGlobalContributorsStatsToS3 } from '../../core/features/contributors';
import {
  refreshGroupGeoJsonFiles,
  refreshGuideGeoJsonFiles,
  refreshLineGeoJsonFiles,
  refreshSpotGeoJsonFiles,
} from '../../core/features/geojson';
import { db } from '../../core/db';
import { addActivatedChangelog } from '../../core/features/mapFeature/changelog';
import { logger } from '../../core/logger';

logger.setLambdaName('cronJob');

// The hourly run: an activation scheduled for later reaches the map files when it starts, since no
// write happens then. A two-hour window covers a run that was late or missed.
const refreshStartedActivations = async () => {
  const nowSeconds = Date.now() / 1000;
  const all = [...(await db.getAllActivations('line')), ...(await db.getAllActivations('spot'))];
  const started = all.filter((a) => a.from > nowSeconds - 2 * 3600 && a.from <= nowSeconds && a.until > nowSeconds);
  for (const activation of started) {
    const { featureType, featureId } = activation;
    if (featureType === 'line') await refreshLineGeoJsonFiles({ lineIdToUpdate: featureId });
    else await refreshSpotGeoJsonFiles({ spotIdToUpdate: featureId });
    const feature = featureType === 'line' ? await db.getLineDetails(featureId) : await db.getSpotDetails(featureId);
    // Dated at the start, so a second run in the window rewrites the same entry.
    if (feature) await addActivatedChangelog(feature, activation.activatedBy, new Date(activation.from * 1000));
  }
  logger.info('Started activations refreshed', { count: started.length });
};

const cronJobHandler = async (event?: { job?: string }) => {
  try {
    if (event?.job === 'activationStarts') return await refreshStartedActivations();
    await runGenericCronJob();
  } catch (err) {
    if (err instanceof Error) {
      logger.error('cronJobHandler failed', { message: err.message, stack: err.stack });
    }
  }
};

const runGenericCronJob = async () => {
  const { updatedLines } = await refreshLineGeoJsonFiles();
  const { updatedSpots } = await refreshSpotGeoJsonFiles();
  const { updatedGuides } = await refreshGuideGeoJsonFiles();

  console.log('Lines:', updatedLines?.length);
  console.log('Spots:', updatedSpots?.length);
  const { groupCount } = await refreshGroupGeoJsonFiles();

  console.log('Guides:', updatedGuides?.length);
  console.log('Groups:', groupCount);

  await refreshGlobalContributorsStatsToS3();

  // const allFeatures = [
  //   ...(updatedLines?.items ?? []),
  //   ...(updatedSpots?.items ?? []),
  //   ...(updatedGuides?.items ?? []),
  // ];

  // let position = 0;
  // const batchSize = 100;
  // while (position < allFeatures.length) {
  //   const itemsForBatch = allFeatures.slice(position, position + batchSize);
  //   if (itemsForBatch.length === 0) {
  //     break;
  //   }
  //   await batchProcessFeatures(itemsForBatch);
  //   position += batchSize;
  // }
};

// const batchProcessFeatures = async (
//   features: (DDBLineDetailItem | DDBSpotDetailItem | DDBGuideDetailItem)[],
// ) => {
//   const promises = [];
//   for (const f of features) {
//     const feature = genericFeatureFromItem(f);
//     //
//   }
//   return Promise.all(promises);
// };

export const main = cronJobHandler;
