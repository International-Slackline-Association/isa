import { Request } from '../../../http';
import { jsonRoute, validateApiPayload, verifyRequestClaims } from '../../utils';
import { getUserDetails } from '../../../../core/features/isaUser';
import { sendNewMessageEmail } from '../../../../core/utils/email/sendMessage';

import { sendUserMessageSchema } from './schema';

export const sendUserMessage = async (req: Request) => {
  const requestClaims = verifyRequestClaims(req);
  const body = validateApiPayload(req.body, sendUserMessageSchema);

  const senderDetails = await getUserDetails(requestClaims.isaId, { includeEmail: true });

  let recipientEmail: string | undefined;
  if (body.recipient.type === 'email') {
    recipientEmail = body.recipient.email;
  } else {
    const receiverDetails = await getUserDetails(body.recipient.userId, { includeEmail: true });
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
