import { logger } from '../logger';

interface ProcessImagePayload {
  input: {
    s3: {
      bucket?: string;
      key: string;
    };
  };
  output: {
    s3: {
      bucket: string;
      key: string;
    };
  };
  outputFormat: 'jpeg' | 'png' | 'webp';
  resize: {
    width: number;
    height: number;
    fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  quality: number;
  cacheControl?: string;
}
const processImage = async (payload: ProcessImagePayload) => {
  try {
    const response = await fetch(
      'https://tools-api.slacklineinternational.org/image-processor/process',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ISA_TOOLS_TRUSTED_SERVICE_API_KEY as string,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }
    return true;
  } catch (err) {
    logger.error('Error while processing image', { message: (err as Error).message });
    return false;
  }
};

export const isaToolsApi = {
  processImage,
};
