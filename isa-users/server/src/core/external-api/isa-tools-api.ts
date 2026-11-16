import { logger } from '../logger';

const baseUrl = 'https://tools-api.slacklineinternational.org/';

// isa-users' own client (isa-users-service) is granted its isa-tools scopes in infra config.
let token: { value: string; expiresAt: number } | undefined;

const getToken = async () => {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const credentials = Buffer.from(
    `${process.env.ISA_USERS_SERVICE_CLIENT_ID}:${process.env.ISA_USERS_SERVICE_CLIENT_SECRET}`,
  ).toString('base64');
  const response = await fetch(`https://${process.env.AUTH_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  logger.info('isa-tools token request', { status: response.status });
  if (!response.ok) {
    throw new Error(`isa-tools token request failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
};

const request = async (
  method: 'GET' | 'POST',
  path: string,
  payload?: unknown,
  { signedIn = true } = {},
) => {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    method,
    headers: {
      ...(signedIn && { Authorization: `Bearer ${await getToken()}` }),
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

const listCertificates = async (isaId: string, email: string) => {
  const query = `?isaId=${encodeURIComponent(isaId)}&email=${encodeURIComponent(email)}`;
  const response = await request('GET', `v1/certificates${query}`);

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
  const response = await request('POST', `v1/certificates/generate`, payload);
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
  const response = await request('POST', `v1/sign`, payload);
  return response as {
    token: string;
    verificationUrl: string;
    expiresAt: string;
  };
};

const verifySignedDocument = async (token: string) => {
  const response = await request('GET', `sign/verify?token=${encodeURIComponent(token)}`, undefined, { signedIn: false });
  return response as {
    isVerified: boolean;
    subject: string;
    issuedAt: string;
    expiresAt: string;
    content: string;
  };
};

export const isaToolsApi = {
  listCertificates,
  generateCertificate,
  signDocument,
  verifySignedDocument,
};
