import { refreshGlobalContributorsStatsToS3 } from '../../core/features/contributors';
import {
  refreshActiveGeoJsonFile,
  refreshGroupGeoJsonFiles,
  refreshGuideGeoJsonFiles,
  refreshLineGeoJsonFiles,
  refreshSpotGeoJsonFiles,
} from '../../core/features/geojson';
import { db } from '../../core/db';
import { startDueDate } from '../../core/features/activation';
import { ActivatableFeatureType } from '../../core/db/entities/activation';
import { webUrl } from '../../core/domain';
import { getUserDetails } from '../../core/features/isaUser';
import { sendActivationReminderEmail } from '../../core/utils/email/sendActivationReminder';
import { addActivatedChangelog } from '../../core/features/mapFeature/changelog';
import { logger } from '../../core/logger';

logger.setLambdaName('cronJob');

const day = 24 * 3600;
const featureOf = (featureType: ActivatableFeatureType, featureId: string) =>
  featureType === 'line' ? db.getLineDetails(featureId) : db.getSpotDetails(featureId);

const errorData = (error: unknown) => ({ message: (error as Error).message, stack: (error as Error).stack });

const startActivationDates = async () => {
  const now = Math.floor(Date.now() / 1000);
  const all = [...(await db.getAllActivationDates('line')), ...(await db.getAllActivationDates('spot'))];
  const counts: Record<string, number> = { sets: all.length, failed: 0 };
  for (const record of all) {
    const { featureType, featureId } = record;
    try {
      const outcome = await startDueDate(record, now);
      counts[outcome] = (counts[outcome] ?? 0) + 1;
      if (outcome === 'busy' || outcome === 'featureGone') logger.info(`activation date not started: ${outcome}`, { featureType, featureId });
    } catch (error) {
      counts.failed++;
      logger.error('activation date start failed', { featureType, featureId, ...errorData(error) });
    }
  }
  logger.info('activation dates checked', counts);
};

const sendActivationReminders = async () => {
  const now = Math.floor(Date.now() / 1000);
  const [activations, datesRecords] = await Promise.all([
    Promise.all([db.getAllActivations('line'), db.getAllActivations('spot')]).then((all) => all.flat()),
    Promise.all([db.getAllActivationDates('line'), db.getAllActivationDates('spot')]).then((all) => all.flat()),
  ]);
  // About a day before the end, from 30 to 12 hours ahead: an end at 23:59 is reminded the evening before, not at night,
  // and an activation never gets it right after it was made.
  const ending = activations.filter(
    (a) =>
      a.activatedBy &&
      a.remind &&
      !a.remindedAt &&
      a.until - now <= 30 * 3600 &&
      a.until - now > 12 * 3600 &&
      now - a.activatedAt >= 6 * 3600,
  );
  // Only a set that ran down: one made with its last date already within the week needs no nudge.
  const runningOut = datesRecords.filter((d) => {
    const lastUntil = d.dates[d.dates.length - 1]?.until;
    return d.remind && lastUntil > now && lastUntil - now < 7 * day && lastUntil - d.activatedAt > 7 * day && d.remindedForUntil !== lastUntil;
  });
  const counts = { due: ending.length + runningOut.length, sent: 0, skipped: 0, failed: 0 };

  const remind = async (
    kind: 'ending' | 'datesRunningOut',
    item: { featureType: ActivatableFeatureType; featureId: string; userId: string },
    markSent: () => Promise<void>,
  ) => {
    const { featureType, featureId, userId } = item;
    try {
      const [user, feature] = await Promise.all([getUserDetails(userId, { includeEmail: true }), featureOf(featureType, featureId)]);
      if (!user?.email || !feature) {
        // Marked anyway: a member without an email, or a deleted feature, would be tried every hour.
        await markSent();
        counts.skipped++;
        logger.warn('activation reminder skipped', { featureType, featureId, kind, userId, hasUser: Boolean(user), hasEmail: Boolean(user?.email), hasFeature: Boolean(feature) });
        return;
      }
      await sendActivationReminderEmail({
        kind,
        to: { name: user.fullname, email: user.email },
        featureName: feature.name || `this ${featureType}`,
        featureUrl: `${webUrl}/${featureType}/${featureId}`,
      });
      await markSent();
      counts.sent++;
      logger.info('activation reminder done', { featureType, featureId, kind, userId });
    } catch (error) {
      counts.failed++;
      logger.error('activation reminder failed', { featureType, featureId, kind, userId, ...errorData(error) });
    }
  };

  for (const a of ending) {
    await remind('ending', { featureType: a.featureType, featureId: a.featureId, userId: a.activatedBy! }, () =>
      db.markActivationReminded(a.featureType, a.featureId, a.until, now),
    );
  }
  for (const d of runningOut) {
    await remind('datesRunningOut', { featureType: d.featureType, featureId: d.featureId, userId: d.activatedBy }, () =>
      db.markDatesReminded(d.featureType, d.featureId, d.dates[d.dates.length - 1].until),
    );
  }
  logger.info('activation reminders checked', counts);
};

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
  // An activation that ends needs no write either, so the partners' file is rewritten every hour.
  await refreshActiveGeoJsonFile();
  logger.info('Started activations refreshed', { count: started.length });
};

const cronJobHandler = async (event?: { job?: string }) => {
  try {
    if (event?.job === 'activationStarts') {
      const steps = { startActivationDates, refreshStartedActivations, sendActivationReminders };
      for (const [name, step] of Object.entries(steps)) {
        const start = Date.now();
        try {
          await step();
          logger.info('hourly step done', { step: name, ms: Date.now() - start });
        } catch (error) {
          logger.error('hourly step failed', { step: name, ms: Date.now() - start, ...errorData(error) });
        }
      }
      return;
    }
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
