import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '../../aws/clients';

const isaAddress = 'slackmap@slacklineinternational.org';

// Plain text: the reason is user-written and nothing in it is rendered.
export const sendDeleteRequestEmail = async (params: {
  requester: { name: string; email: string };
  ownerEmails: string[];
  featureType: string;
  featureUrl: string;
  reason: string;
}) => {
  const ownerNote =
    params.ownerEmails.length > 0
      ? `You own this ${params.featureType}. If you agree, delete it from its menu on SlackMap. Reply to this email to answer the requester.`
      : `This ${params.featureType} has no reachable owner.`;
  const text = [
    `${params.requester.name} asks to delete this ${params.featureType} on SlackMap:`,
    params.featureUrl,
    '',
    'Reason:',
    params.reason,
    '',
    ownerNote,
  ].join('\n');

  await ses.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [isaAddress], BccAddresses: params.ownerEmails },
      Message: {
        Subject: { Charset: 'UTF-8', Data: `Delete request for a ${params.featureType} on SlackMap` },
        Body: { Text: { Charset: 'UTF-8', Data: text } },
      },
      ReplyToAddresses: [params.requester.email],
      Source: `"SlackMap" <${isaAddress}>`,
    }),
  );
};
