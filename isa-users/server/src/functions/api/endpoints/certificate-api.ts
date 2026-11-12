import { isaToolsApi } from '../../../core/external-api/isa-tools-api';
import type { Request } from '../../http';
import { jsonRoute, validateUserExists } from '../utils';

export const getAllCertificates = async (request: Request) => {
  const certificates = await isaToolsApi.listCertificates(
    request.user!.isaId,
    request.user!.email,
  );
  return certificates;
};

export const generateCertificate = async (request: Request) => {
  const { name, surname } = await validateUserExists(request.user!.isaId);

  const response = await isaToolsApi.generateCertificate({
    certificateType: request.body.certificateType,
    certificateId: request.body.certificateId,
    subject: `${name} ${surname}`,
    language: request.body.language,
  });
  return response;
};

export const certificateRoutes = {
  'GET /certificate/all': jsonRoute(getAllCertificates),
  'PUT /certificate/generate': jsonRoute(generateCertificate),
};
