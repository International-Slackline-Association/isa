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
const baseUrl = 'https://tools-api.slacklineinternational.org/';

const request = async (method: 'GET' | 'POST', path: string, payload?: unknown) => {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    method,
    headers: {
      'x-api-key': process.env.ISA_TOOLS_TRUSTED_SERVICE_API_KEY as string,
      ...(payload !== undefined && { 'content-type': 'application/json' }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  // The query string carries personal data, so only the path is logged.
  logger.info('isa-tools request', { method, path: url.pathname, status: response.status });
  if (!response.ok) {
    throw new Error(`Request failed with status code ${response.status}`);
  }
  return response.json();
};

const processImage = async (payload: ProcessImagePayload) => {
  return request('POST', 'image-processor/process', payload)
    .then(() => true)
    .catch((err) => {
      logger.error('Error while processing image', { message: err.message });
      return false;
    });
};

const listCertificates = async (isaId: string, email: string) => {
  const query = `?isaId=${isaId}&email=${email}`;
  const response = await request('GET', `sheets/certificate${query}`);

  return response as {
    certificates: {
      certificateType: string;
      certId: string;
      title: string;
      isaId?: string;
      email?: string;
    }[];
    certificateLanguages: { [key: string]: string[] };
  };
};

const generateCertificate = async (payload: {
  certificateType: string;
  certificateId: string;
  subject: string;
  language: string;
}) => {
  const response = await request('POST', `sheets/certificate/generate`, payload);
  return response as {
    pdfUrl: string;
    certificateId: string;
  };
};

const signDocument = async (payload: {
  subject: string;
  expiresInSeconds: number;
  createHash?: boolean;
  content: string;
}) => {
  const response = await request('POST', `sign`, payload);
  return response as {
    token: string;
    verificationUrl: string;
    expiresAt: string;
  };
};

const verifySignedDocument = async (token: string) => {
  const response = await request('GET', `sign/verify?token=${token}`);
  return response as {
    isVerified: boolean;
    subject: string;
    issuedAt: string;
    expiresAt: string;
    content: string;
  };
};

export const isaToolsApi = {
  processImage,
  listCertificates,
  generateCertificate,
  signDocument,
  verifySignedDocument,
};
