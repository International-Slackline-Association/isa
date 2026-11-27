import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '../../aws/clients';
import { logger } from '../../logger';

const isaAddress = 'slackmap@slacklineinternational.org';

// No date or hour in the text: the server does not know the member's time zone.
const texts = {
  ending: (featureName: string) => ({
    subject: `${featureName} ends soon on SlackMap`,
    body: `Your activation of ${featureName} ends within about a day. If it stays up, extend it; if it is down, deactivate it:`,
  }),
  datesRunningOut: (featureName: string) => ({
    subject: `The last date for ${featureName} is coming up`,
    body: `The last of your dates for ${featureName} on SlackMap is within a week. If you meet there again, add more dates:`,
  }),
};

export const sendActivationReminderEmail = async (params: {
  kind: keyof typeof texts;
  to: { name: string; email: string };
  featureName: string;
  featureUrl: string;
}) => {
  if (process.env.SLACKMAP_EMAIL_DISABLED === 'true') {
    logger.info('Email skipped', { featureUrl: params.featureUrl, kind: params.kind });
    return;
  }
  const { subject, body } = texts[params.kind](params.featureName);
  const text = [
    `Hi ${params.to.name},`,
    '',
    body,
    params.featureUrl,
    '',
    'You get this because you activated it with your name. To stop these emails, untick "Email me" on its page.',
  ].join('\n');

  await ses.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [params.to.email] },
      Message: {
        Subject: { Charset: 'UTF-8', Data: subject },
        Body: { Text: { Charset: 'UTF-8', Data: text } },
      },
      Source: `"SlackMap" <${isaAddress}>`,
    }),
  );
  logger.info('Activation reminder sent', { featureUrl: params.featureUrl, kind: params.kind });
};
