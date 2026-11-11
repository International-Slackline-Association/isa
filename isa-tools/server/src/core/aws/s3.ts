import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from 'core/aws/clients';

export const uploadPDFToS3 = async (key: string, body: Buffer) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.TEMPORARY_UPLOADS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
      CacheControl: 'public, no-cache',
    }),
  );

  const command = new GetObjectCommand({
    Bucket: process.env.TEMPORARY_UPLOADS_S3_BUCKET,
    Key: key,
  });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return { presignedUrl };
};
