import { formatCertificateDate } from '../../../core/certificates/generators/utils';
import { certificateSpreadsheet } from '../../../core/spreadsheets/certificates';
import { getEquipmentWarnings } from '../../../core/spreadsheets/equipment-warnings';
import { getSairReports } from '../../../core/spreadsheets/sair-reports';

import { type Request, json } from '../../http';
import { verifyTrustedDomainRequest } from '../auth';

const listInstructors = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const instructors = await certificateSpreadsheet.getInstructors();

  const items = instructors
    .map((i) => ({
      email: i.email,
      certId: i.certId,
      name: `${i.name ?? ''} ${i.surname ?? ''}`,
      country: i.country,
      level: i.level,
      expirationDate: formatCertificateDate(i.endDate, undefined, { safeParse: true }).pretty,
    }))
    .sort(sortByField('country', 'name'))
    .filter((i) => i.name.length > 2);

  return json({ items });
};

const listRiggers = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const riggers = await certificateSpreadsheet.getRiggers();
  const items = riggers
    .map((i) => ({
      email: i.email,
      certId: i.certId,
      name: `${i.name ?? ''} ${i.surname ?? ''}`,
      country: i.country,
      level: i.level,
      expirationDate: formatCertificateDate(i.endDate, undefined, { safeParse: true }).pretty,
    }))
    .sort(sortByField('country', 'name'))
    .filter((i) => i.name.length > 2);

  return json({ items });
};

const listCertifiedGears = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const gears = await certificateSpreadsheet.getApprovedGears();
  const items = gears
    .map((i) => {
      const { isaId, ...rest } = i;
      return rest;
    })
    .sort(sortByField('brand'));

  return json({ items });
};

const listEquipmentWarnings = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const warnings = await getEquipmentWarnings();
  const items = warnings.sort((a, b) => {
    if (a.status === 'Recall' && b.status !== 'Recall') return -1;
    if (a.status !== 'Recall' && b.status === 'Recall') return 1;

    if (a.status === 'Warning' && b.status !== 'Warning') return -1;
    if (a.status !== 'Warning' && b.status === 'Warning') return 1;

    return 0;
  });

  return json({ items });
};

const listSairReports = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const reports = await getSairReports();
  const items = reports.sort(sortByField('incidentDateParsed')).reverse();

  return json({ items });
};

const listWorldRecords = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const worldRecords = await certificateSpreadsheet.getWorldRecords();

  const items = worldRecords
    .map((i) => {
      const { isaId, email, date, ...rest } = i;
      const dateParsed = formatCertificateDate(date, 'dd.MM.yyyy', { safeParse: true }).date;
      return { ...rest, dateParsed, date: date || 'Unknown' };
    })
    .sort(sortByField('dateParsed'))
    .reverse();

  return json({ items });
};

const listWorldFirsts = async (request: Request) => {
  verifyTrustedDomainRequest(request);

  const worldFirsts = await certificateSpreadsheet.getWorldFirsts();

  const items = worldFirsts
    .map((i) => {
      const { isaId, email, date, ...rest } = i;
      const dateParsed = formatCertificateDate(date, 'dd.MM.yyyy', { safeParse: true }).date;
      return { ...rest, dateParsed, date: date || 'Unknown' };
    })
    .sort(sortByField('dateParsed'))
    .reverse();

  return json({ items });
};

const sortByField = (...fields: string[]) => {
  return (a: any, b: any) => {
    for (const field of fields) {
      if ((a[field] ?? '') < (b[field] ?? '')) return -1;
      if ((a[field] ?? '') > (b[field] ?? '')) return 1;
    }
    return 0;
  };
};

export const listingsRoutes = {
  'GET /sheets/list/instructors': listInstructors,
  'GET /sheets/list/riggers': listRiggers,
  'GET /sheets/list/approved-gears': listCertifiedGears,
  'GET /sheets/list/equipment-warnings': listEquipmentWarnings,
  'GET /sheets/list/sair-reports': listSairReports,
  'GET /sheets/list/world-records': listWorldRecords,
  'GET /sheets/list/world-firsts': listWorldFirsts,
};
