import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3 } from '../../aws/clients';

// No sharp here: the stream handlers import this module, and only the API Lambda installs sharp.

export const deleteAllFeatureImages = async (featureId: string) => {
  const images = await getAllFeatureImages(featureId, '');
  for (const image of images) {
    await deleteFeatureImage(image.key);
  }
};

export const getAllFeatureImages = async (featureId: string, prefix: string) => {
  const keys = await s3
    .send(
      new ListObjectsV2Command({
        Bucket: process.env.SLACKMAP_IMAGES_S3_BUCKET,
        Prefix: constructS3Key(featureId, prefix),
      }),
    )
    .then((data) => {
      return (data.Contents || [])
        .map((c) => {
          if (c.Key) {
            const imageName = c.Key.split('/').pop()?.split('.');
            if (!imageName) return undefined;
            return { key: c.Key, imageId: imageName[0], type: imageName[1] };
          }
          return undefined;
        })
        .filter((c) => c !== undefined) as { key: string; imageId: string; type: string }[];
    });

  return keys;
};

export const deleteFeatureImage = async (key: string) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.SLACKMAP_IMAGES_S3_BUCKET,
      Key: key,
    }),
  );
};

export const constructS3Key = (featureId: string, prefix: string, imageId?: string, type?: string) => {
  let path = `public/${featureId}/`;
  if (prefix) {
    path += `${prefix}/`;
  }
  if (imageId && type) {
    path += `${imageId}.${type}`;
  }
  return path;
};

