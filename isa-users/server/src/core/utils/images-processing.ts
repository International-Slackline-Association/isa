import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

import { s3 } from '../aws/clients';

// Uploads are untrusted and browsers send only JPEG, PNG or WebP, so no other decoder runs (HEIF's
// was where sharp's critical 2026 CVE was).
sharp.block({ operation: ['VipsForeignLoad'] });
sharp.unblock({
  operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer', 'VipsForeignLoadWebpBuffer'],
});

// sharp drops all metadata (GPS included) by default.
export const processAndPutProfilePhoto = async (uploadKey: string, isaId: string) => {
  const s3Key = `public/${isaId}/profilePicture_${new Date().toISOString()}.jpeg`;
  const upload = await s3.send(
    new GetObjectCommand({ Bucket: process.env.ISA_USERS_UPLOADS_S3_BUCKET, Key: uploadKey }),
  );
  const image = await sharp(await upload.Body!.transformToByteArray())
    .autoOrient()
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.ISA_USERS_IMAGES_S3_BUCKET,
      Key: s3Key,
      Body: image,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=864000',
    }),
  );
  return { s3Key };
};

export const deleteProfilePhoto = async (s3Key: string) => {
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.ISA_USERS_IMAGES_S3_BUCKET as string, Key: s3Key }),
  );
};
