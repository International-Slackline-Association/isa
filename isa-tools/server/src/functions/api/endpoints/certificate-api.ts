import { uploadPDFToS3 } from '../../../core/aws/s3';
import { generateCertificatePDF } from '../../../core/certificates/generators/certificateGenerator';
import { certificateSpreadsheet } from '../../../core/spreadsheets/certificates';
import { CertificateType } from '../../../core/spreadsheets/types';
import { type Request, json, validate } from '../../http';
import { verifyTrustedDomainRequest, verifyTrustedServiceRequest } from '../auth';
import { generateCertificatePostBodySchema, listCertificatesQueryParamsSchema } from './schema';

const listCertificates = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const query = validate(request.query, listCertificatesQueryParamsSchema);

  const certs = await certificateSpreadsheet.getAllItems({
    isaId: query.isaId,
    email: query.email,
  });

  const certificateLanguages: { [key in CertificateType]: string[] } = {
    instructor: ['en'],
    rigger: ['en'],
    'athletic-award': ['en'],
    'athlete-excellence': ['en'],
    'isa-membership': ['en'],
    'world-record': ['en'],
    'approved-gear': ['en'],
    judge: [],
    'contest-organizer': ['en'],
    'honorary-member': ['en'],
    'isa-partnership': ['en'],
    'world-first': ['en'],
  };

  return json({ certificates: certs, certificateLanguages });
};

const generateCertificate = async (request: Request) => {
  verifyTrustedServiceRequest(request);

  const body = validate(request.body, generateCertificatePostBodySchema);

  const { pdfBytes } = await generateCertificatePDF({
    certificateType: body.certificateType as CertificateType,
    certificateId: body.certificateId,
    subject: body.subject,
    language: body.language,
  });

  const buffer = Buffer.from(pdfBytes);
  const { presignedUrl } = await uploadPDFToS3(
    `certificates/${body.certificateId}-${body.language}.pdf`,
    buffer,
  );

  return json({ pdfUrl: presignedUrl, certificateId: body.certificateId });
};

export const certificateRoutes = {
  'GET /sheets/certificate': listCertificates,
  'POST /sheets/certificate/generate': generateCertificate,
};
