import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { cisProvider } from '../../../core/aws/clients';
import * as db from '../../../core/db';
import { isaToolsApi } from '../../../core/external-api/isa-tools-api';
import { logger } from '../../../core/logger';
import { generateISAIdFromUsername } from '../../../core/utils';
import { sendEmailVerificationLink } from '../../cognito/verify';
import { type Request, html } from '../../http';
import { jsonRoute } from '../utils';

const forgotPasswordUrl =
  `https://${process.env.AUTH_DOMAIN}/forgotPassword?client_id=${process.env.ACCOUNT_CLIENT_ID}` +
  `&response_type=code&redirect_uri=${encodeURIComponent(`https://${process.env.ACCOUNT_DOMAIN}`)}`;

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
    return html(
      `<html><body style="font-family: sans-serif"><h3>${email} has been verified.</h3>` +
        `<p>You can now <a href="${forgotPasswordUrl}">reset your password</a> or ` +
        `<a href="https://${process.env.ACCOUNT_DOMAIN}">sign in</a>.</p></body></html>`,
    );
  }

  return html(`<html><body><h3>Verification failed</h3></body></html>`);
};

const maxEmailsPerDay = 3;

// Answers the same whatever the email, so it never tells whether an account exists.
export const sendVerificationEmail = async (request: Request) => {
  const email = String(request.body?.email ?? '').trim();
  if (email.length > 128 || !/^[^\s@]+@[^\s@]+$/.test(email)) return {};

  // The pool signs in by email, case-insensitively, so the email is the username here.
  const cognitoUser = await cisProvider
    .send(new AdminGetUserCommand({ UserPoolId: process.env.USERPOOL_ID, Username: email }))
    .catch((error: Error) => {
      if (error.name === 'UserNotFoundException' || error.name === 'InvalidParameterException') {
        return undefined;
      }
      throw error;
    });
  const attribute = (name: string) =>
    cognitoUser?.UserAttributes?.find((a) => a.Name === name)?.Value;
  const verified = attribute('email_verified') === 'true';
  const cognitoEmail = attribute('email');
  if (!cognitoUser?.Username || !cognitoEmail || verified) {
    logger.info('Verification email not needed', { found: Boolean(cognitoUser), verified });
    return {};
  }

  const isaId = generateISAIdFromUsername(cognitoUser.Username);
  const day = new Date().toISOString().slice(0, 10);
  if (!(await db.claimVerificationEmail(isaId, day, maxEmailsPerDay))) {
    logger.info('Verification email not sent: daily limit reached or no user record', { isaId });
    return {};
  }
  try {
    await sendEmailVerificationLink(cognitoUser.Username, cognitoEmail);
    logger.info('Verification email sent', { isaId });
  } catch (error) {
    logger.error('Verification email failed', { isaId, error: (error as Error).message });
  }
  return {};
};

export const verifyRoutes = {
  'GET /verify/confirm-email': verifyEmail,
  'POST /verify/send-email': jsonRoute(sendVerificationEmail),
};
