import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

import { cisProvider } from '../../../core/aws/clients';
import { isaToolsApi } from '../../../core/external-api/isa-tools-api';
import { logger } from '../../../core/logger';
import { type Request, html } from '../../http';

export const verifyEmail = async (request: Request) => {
  const token = request.query.token as string;

  const { content, isVerified } = await isaToolsApi.verifySignedDocument(token);

  if (isVerified) {
    const { username, email } = JSON.parse(content);
    await cisProvider.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.USERPOOL_ID,
        Username: username,
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      }),
    );
    logger.info('Email verified');
    return html(`<html><body><h3>${email} has been verified.</h3></body></html>`);
  }

  return html(`<html><body><h3>Verification failed</h3></body></html>`);
};

export const verifyRoutes = {
  'GET /verify/confirm-email': verifyEmail,
};
