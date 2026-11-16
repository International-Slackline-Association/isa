import * as crypto from 'crypto';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { z } from 'zod';

import { s3ImageUploadZodSchema } from '../../../functions/api/utils';
import { s3 } from '../../aws/clients';
import { logger } from '../../logger';
import { constructS3Key, deleteFeatureImage, getAllFeatureImages } from './image';

export const updateFeatureImagesInS3 = async (
  featureId: string,
  images: z.infer<typeof s3ImageUploadZodSchema>,
  opts: {
    prefix?: string;
    maxImageNumber: number;
  },
) => {
  if (!images) return;

  const prefix = opts.prefix || 'media';

  let s3Images = await getAllFeatureImages(featureId, prefix);

  for (const { imageId, key } of s3Images) {
    if (!images.find((i) => i.id === imageId)) {
      await deleteFeatureImage(key);
    }
  }

  s3Images = await getAllFeatureImages(featureId, prefix);

  let totalImageCount = s3Images.length;
  const addedImages = images?.filter((i) => i.isInProcessingBucket) ?? [];
  for (const addedImage of addedImages) {
    if (totalImageCount >= opts.maxImageNumber) {
      break;
    }
    // A photo that cannot be processed is dropped, so the feature still saves with the others.
    try {
      await processAndPutFeatureImage(addedImage.s3Key, featureId, prefix, generateImageId());
      totalImageCount++;
    } catch (error) {
      logger.error('Feature image could not be processed', {
        featureId,
        uploadKey: addedImage.s3Key,
        message: (error as Error).message,
      });
    }
  }

  s3Images = await getAllFeatureImages(featureId, prefix);
  const featureImages = s3Images.map((image) => ({
    s3Key: image.key,
    isCover: images?.find((i) => i.id === image.imageId)?.isCover,
    id: image.imageId,
  }));

  return featureImages;
};

// Uploads are untrusted and browsers send only JPEG, PNG or WebP, so no other decoder runs (HEIF's
// was where sharp's critical 2026 CVE was).
sharp.block({ operation: ['VipsForeignLoad'] });
sharp.unblock({
  operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer', 'VipsForeignLoadWebpBuffer'],
});

// sharp drops all metadata (GPS included) by default.
const processAndPutFeatureImage = async (
  uploadKey: string,
  featureId: string,
  prefix: string,
  imageId: string,
) => {
  const upload = await s3.send(
    new GetObjectCommand({ Bucket: process.env.SLACKMAP_UPLOADS_S3_BUCKET, Key: uploadKey }),
  );
  const image = await sharp(await upload.Body!.transformToByteArray())
    .autoOrient()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.SLACKMAP_IMAGES_S3_BUCKET,
      Key: constructS3Key(featureId, prefix, imageId, 'jpeg'),
      Body: image,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=864000',
    }),
  );
};

const generateImageId = () => {
  return crypto.randomBytes(2).toString('hex');
};
