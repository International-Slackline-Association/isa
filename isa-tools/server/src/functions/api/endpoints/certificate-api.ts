import { uploadPDFToS3 } from '../../../core/aws/s3';
import { generateCertificatePDF } from '../../../core/certificates/generators/certificateGenerator';
import { certificateSpreadsheet } from '../../../core/spreadsheets/certificates';
import { CertificateType } from '../../../core/spreadsheets/types';
import { type Request, json, validate } from '../../http';
import { requireAppScope } from '../auth';
import { generateCertificatePostBodySchema, listCertificatesQueryParamsSchema } from './schema';

const listCertificates = async (request: Request) => {
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
  'GET /v1/certificates': async (request: Request) => {
    requireAppScope(request, 'certificates.list');
    return listCertificates(request);
  },
  'POST /v1/certificates/generate': async (request: Request) => {
    requireAppScope(request, 'certificates.generate');
    return generateCertificate(request);
  },
};
