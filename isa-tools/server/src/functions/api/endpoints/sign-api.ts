import * as dateFns from 'date-fns';
import { createSignedDocument, getSignedDocument } from '../../../core/documentVerification';
import { type Request, json, validate } from '../../http';
import { verifyTrustedServiceRequest } from '../auth';
import { signDocumentPostBodySchema } from './schema';

const sign = async (request: Request) => {
  verifyTrustedServiceRequest(request);

  const body = validate(request.body, signDocumentPostBodySchema);

  const { token, verificationUrl, expiresAt } = await createSignedDocument({
    subject: body.subject,
    expiresInSeconds: body.expiresInSeconds,
    createHash: body.createHash,
    content: body.content,
  });

  return json({ token, verificationUrl, expiresAt });
};

const verifySignedDocument = async (request: Request) => {
  const code = request.query.token;
  if (!code) throw new Error('No token provided');

  try {
    const document = await getSignedDocument(code);
    return json({
      isVerified: true,
      subject: document.subject,
      issuedAt: dateFns.format(document.issuedAt, 'PPP'),
      expiresAt: dateFns.format(document.expiresAt, 'PPP'),
      content: document.payload.content,
    });
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
    return json({ isVerified: false, content: errorMessage });
  }
};

export const signRoutes = {
  'POST /sign': sign,
  'GET /sign/verify': verifySignedDocument,
};
