import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from 'core/aws/clients';
import express, { Request, Response } from 'express';
import sharp, { Sharp } from 'sharp';

import { ProcessImagePostBody, processImageSchema } from './schema';
import { catchExpressJsErrorWrapper, validateApiPayload } from './utils';

export const processImage = async (req: Request<any, any, ProcessImagePostBody>, res: Response) => {
  const body = req.body;
  validateApiPayload(body, processImageSchema);

  const s3Image = await s3.send(
    new GetObjectCommand({
      Bucket: body.input.s3?.bucket || process.env.TEMPORARY_UPLOADS_S3_BUCKET!,
      Key: body.input.s3?.key,
    }),
  );
  const streamToString = await s3Image.Body!.transformToString('base64');
  const sharpObject = sharp(Buffer.from(streamToString, 'base64'));

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
  const newImageSize = Buffer.byteLength(newImageBuffer, 'base64');

  if (body.output.raw) {
    res.writeHead(200, {
      'content-type': contentType,
      'content-encoding': 'base64',
      'content-length': newImageSize,
    });
    res.end(newImageBuffer);
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
    res.status(200).json({});
  } else {
    throw new Error('Validation: Invalid output parameters');
  }
};

const resize = async (sharpObject: Sharp, options: ProcessImagePostBody) => {
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
export const api = express.Router();
api.post('/', catchExpressJsErrorWrapper(processImage));
