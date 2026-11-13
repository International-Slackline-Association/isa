import { db } from '../../../../core/db';
import { Request } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';
import { getUserDetails } from '../../../../core/features/isaUser';
import { sendNewMessageEmail } from '../../../../core/utils/email/sendMessage';

import { sendUserMessageSchema } from './schema';

const extractEmail = (text?: string) => text?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];

export const sendUserMessage = async (req: Request) => {
  const requestClaims = verifyRequestClaims(req);
  const body = validateApiPayload(req.body, sendUserMessageSchema);

  const senderDetails = await getUserDetails(requestClaims.isaId, { includeEmail: true });

  let recipientUserId: string | undefined;
  let recipientEmail: string | undefined;
  if (body.recipient.type === 'featureContact') {
    const { featureId, featureType } = body.recipient;
    const feature =
      featureType === 'line' ? await db.getLineDetails(featureId) : await db.getSpotDetails(featureId);
    if (!feature) {
      throw new Error(`NotFound: ${featureType} ${featureId} not found`);
    }
    recipientEmail = extractEmail(feature.contactInfo);
    recipientUserId = feature.creatorUserId;
  } else {
    recipientUserId = body.recipient.userId;
  }
  if (!recipientEmail && recipientUserId) {
    const receiverDetails = await getUserDetails(recipientUserId, { includeEmail: true });
    recipientEmail = receiverDetails?.email;
  }

  if (senderDetails && recipientEmail) {
    await sendNewMessageEmail({
      from: {
        username: senderDetails.fullname,
        email: senderDetails.email!,
      },
      to: {
        email: recipientEmail,
      },
      context_url: body.context_url,
      message: body.message,
    });
  }

  return {};
};

export const contactRoutes = {
  'POST /contact/sendUserMessage': jsonRoute(sendUserMessage),
};
