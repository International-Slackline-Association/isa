import * as dateFns from 'date-fns';
import { createSignedDocument } from 'core/documentVerification';

export const formatCertificateDate = (
  date: string | undefined,
  formatStr?: string,
  opts: {
    safeParse?: boolean;
  } = {},
) => {
  try {
    const d = dateFns.parse(date!, formatStr || 'dd.MM.yyyy', new Date());
    return { pretty: dateFns.format(d, 'PPP'), date: d, formal: dateFns.format(d, 'dd.MM.yyyy') };
  } catch (e) {
    if (opts.safeParse) {
      return { pretty: 'Unknown', date: new Date(), formal: 'Unknown' };
    }
    throw e;
  }
};

export const signCertificate = async (payload: {
  subject: string;
  expireDate?: Date;
  content: string;
  skipQRCode?: boolean;
}) => {
  const { content, expireDate, subject, skipQRCode } = payload;

  if (skipQRCode) {
    return { verificationUrl: 'invalid qr' };
  }

  let date = expireDate as Date;
  if (!expireDate) {
    date = dateFns.addMonths(new Date(), 6);
  }

  const signedDocument = await createSignedDocument({
    subject,
    expiresInSeconds: dateFns.differenceInSeconds(date, new Date()),
    createHash: !skipQRCode,
    content: content,
  });

  return signedDocument;
};
