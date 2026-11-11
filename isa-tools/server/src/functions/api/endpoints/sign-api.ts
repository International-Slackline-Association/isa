import * as dateFns from 'date-fns';
import { createSignedDocument, getSignedDocument } from 'core/documentVerification';
import express, { Request } from 'express';

import { expressRoute, validateApiPayload, verifyTrustedServiceRequest } from '../utils';
import { SignDocumentePostBody, signDocumentPostBodySchema } from './schema';

const sign = async (req: Request<any, any, SignDocumentePostBody>) => {
  verifyTrustedServiceRequest(req);

  const body = validateApiPayload(req.body, signDocumentPostBodySchema);

  const { token, verificationUrl, expiresAt } = await createSignedDocument({
    subject: body.subject,
    expiresInSeconds: body.expiresInSeconds,
    createHash: body.createHash,
    content: body.content,
  });

  return {
    token,
    verificationUrl,
    expiresAt,
  };
};

export const verifySignedDocument = async (req: Request) => {
  const code = req.query.token as string;
  if (!code) throw new Error('No token provided');

  try {
    const document = await getSignedDocument(code);
    return {
      isVerified: true,
      subject: document.subject,
      issuedAt: dateFns.format(document.issuedAt, 'PPP'),
      expiresAt: dateFns.format(document.expiresAt, 'PPP'),
      content: document.payload.content,
    };
  } catch (error) {
    let errorMessage = "This document couldn't be verified.";
    if (error instanceof Error) {
      switch (error.message) {
        case 'NotFound':
          errorMessage = 'The document could not be found or it has expired.';
          break;
        case 'Invalid':
          errorMessage = 'The document is NOT signed by the International Slackline Association.';
          break;
        case 'Expired':
          errorMessage = 'The document has expired';
          break;
      }
    }
    return {
      isVerified: false,
      content: errorMessage,
    };
  }
};

export const signApi = express.Router();
signApi.post('/', expressRoute(sign));
signApi.get('/verify', expressRoute(verifySignedDocument));
