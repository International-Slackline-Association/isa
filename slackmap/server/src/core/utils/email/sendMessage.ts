import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '../../aws/clients';

import { logger } from '../../logger';
import newMessageHTML from './__static/newMessageHtml';

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export const sendNewMessageEmail = async (params: {
  from: {
    username: string;
    email: string;
  };
  to: {
    email: string;
  };
  context_url: string;
  message: string;
}) => {
  // Every value is user-written; a replacer function keeps '$' patterns literal.
  const values: Record<string, string> = {
    SENDER_NAME: params.from.username,
    SENDER_EMAIL: params.from.email,
    CONTEXT_URL: params.context_url,
    MESSAGE: params.message,
  };
  const html = newMessageHTML.replace(/{{(\w+)}}/g, (match, key: string) =>
    key in values ? escapeHtml(values[key]) : match,
  );

  logger.debug('Sending email', { contextUrl: params.context_url });
  await ses.send(
    new SendEmailCommand({
      Destination: {
        ToAddresses: [params.to.email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'You have a new message on SlackMap!',
        },
      },
      ReplyToAddresses: [params.from.email],
      Source: '"SlackMap" <slackmap@slacklineinternational.org>',
    }),
  );
};
