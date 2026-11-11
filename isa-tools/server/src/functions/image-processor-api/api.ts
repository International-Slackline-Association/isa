import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../core/aws/clients';
import sharp, { Sharp } from 'sharp';

import { type Request, json, validate } from '../http';
import { ProcessImageBody, processImageSchema } from './schema';

export const processImage = async (request: Request) => {
  const body: ProcessImageBody = request.body;
  // The parsed result is discarded on purpose: the schema's quality default has never been applied.
  validate(body, processImageSchema);

  const s3Image = await s3.send(
    new GetObjectCommand({
      Bucket: body.input.s3?.bucket || process.env.TEMPORARY_UPLOADS_S3_BUCKET!,
      Key: body.input.s3?.key,
    }),
  );
  const sharpObject = sharp(Buffer.from(await s3Image.Body!.transformToByteArray()));

  await resize(sharpObject, body);

  let contentType: string;

  switch (body.outputFormat) {
    case 'jpeg':
      sharpObject.jpeg({ quality: body.quality, mozjpeg: true });
      contentType = 'image/jpeg';
      break;
    case 'png':
      sharpObject.png({ quality: body.quality });
      contentType = 'image/png';
      break;
    case 'webp':
      sharpObject.webp({ quality: body.quality, lossless: true });
      contentType = 'image/webp';
      break;
    default:
      throw new Error('Validation: Invalid output format');
  }

  const newImageBuffer = await sharpObject.toBuffer();

  if (body.output.raw) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Content-Encoding': 'base64',
      },
      body: newImageBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } else if (body.output.s3?.bucket || body.output.s3?.key) {
    await s3.send(
      new PutObjectCommand({
        Bucket: body.output.s3?.bucket,
        Key: body.output.s3?.key,
        Body: newImageBuffer,
        ContentType: contentType,
        ContentEncoding: 'base64',
        CacheControl: body.cacheControl || s3Image.CacheControl,
      }),
    );
    return json({});
  } else {
    throw new Error('Validation: Invalid output parameters');
  }
};

const resize = async (sharpObject: Sharp, options: ProcessImageBody) => {
  const opts = options.resize;
  const metadata = await sharpObject.metadata().then((metadata) => {
    return {
      sizeInKB: metadata.size && metadata.size / 1024,
      width: metadata.width,
      height: metadata.height,
    };
  });

  if (!metadata.sizeInKB || !metadata.width || !metadata.height) {
    return;
  }

  if (opts.scale) {
    sharpObject
      .resize({
        width: Math.round(metadata.width * opts.scale),
        height: Math.round(metadata.height * opts.scale),
        fit: opts.fit,
        withoutEnlargement: true,
      })
      .withMetadata();
    return;
  }
  if (opts.width && opts.height) {
    sharpObject
      .resize({
        width: opts.width,
        height: opts.height,
        fit: opts.fit,
        withoutEnlargement: true,
      })
      .withMetadata();

    return;
  }
};
