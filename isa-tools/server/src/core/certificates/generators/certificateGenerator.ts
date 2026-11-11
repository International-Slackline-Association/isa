import { PDFDocument } from 'pdf-lib';

import { certificateSpreadsheet } from '../../spreadsheets/certificates';
import { CertificateType } from '../../spreadsheets/types';
import { pdfGenerators } from './pdfGenerators';
import { formatCertificateDate, signCertificate } from './utils';

type GenerateCertificatePayload = {
  certificateId: string;
  subject: string;
  language: string;
  skipQRCode?: boolean;
};

export const generateCertificatePDF = async (
  payload: {
    certificateType: CertificateType;
  } & GenerateCertificatePayload,
) => {
  const { certificateType, certificateId, subject, language, skipQRCode } = payload;
  let pdf: PDFDocument | undefined;
  const params = { certificateId, subject, language, skipQRCode };
  switch (certificateType) {
    case 'instructor':
      pdf = await generateInstructor(params);
      break;
    case 'rigger':
      pdf = await generateRigger(params);
      break;
    case 'world-record':
      pdf = await generateWorldRecord(params);
      break;
    case 'athletic-award':
      pdf = await generateAthleticAward(params);
      break;
    case 'athlete-excellence':
      pdf = await generateAthleteExcellenceAward(params);
      break;
    case 'isa-membership':
      pdf = await generateISAMembership(params);
      break;
    case 'honorary-member':
      pdf = await generateHonoraryMember(params);
      break;
    case 'contest-organizer':
      pdf = await generateContestOrganizer(params);
      break;
    case 'isa-partnership':
      pdf = await generateISAPartnership(params);
      break;
    case 'approved-gear':
      pdf = await generateApprovedGear(params);
      break;
    case 'world-first':
      pdf = await generateWorldFirst(params);
      break;
    default:
      throw new Error('Invalid certificate to genereate PDF ');
  }

  const bytes = await pdf!.save();
  return { pdfBytes: bytes };
};

const generateInstructor = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getInstructors({ certId: certificateId }))[0];

  const startDate = formatCertificateDate(item.startDate!);
  const endDate = formatCertificateDate(item.endDate!);

  const { verificationUrl } = await signCertificate({
    subject,
    expireDate: endDate.date,
    skipQRCode,
    content: `"${item.name} ${item.surname}" has a valid "${item.level}" certificate until "${endDate.pretty}"`,
  });

  const pdf = await pdfGenerators.generateInstructorPDF(
    language,
    {
      fullname: `${item.name} ${item.surname}`,
      level: item.level!.toUpperCase(),
      startDate: startDate.formal,
      endDate: endDate.formal,
    },
    verificationUrl,
  );
  return pdf;
};

const generateRigger = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getRiggers({ certId: certificateId }))[0];

  if (!item) {
    throw new Error(`Certificate with ID ${certificateId} not found`);
  }

  const startDate = formatCertificateDate(item.startDate!);
  const expireDate = formatCertificateDate(item.endDate!);

  const { verificationUrl } = await signCertificate({
    subject,
    expireDate: expireDate.date,
    skipQRCode,
    content: `"${item.name} ${item.surname}" has a valid "${item.level}" certificate until "${expireDate.pretty}"`,
  });

  const pdf = await pdfGenerators.generateRiggerPDF(
    language,
    {
      fullname: `${item.name} ${item.surname}`,
      level: item.level!.toUpperCase(),
      startDate: startDate.formal,
      endDate: expireDate.formal,
    },
    verificationUrl,
  );
  return pdf;
};

const generateWorldRecord = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getWorldRecords({ certId: certificateId }))[0];

  const date = formatCertificateDate(item.date!);
  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name}" has a valid WORLD RECORD certificate for "${item.recordType}" achieved on ${date.pretty}`,
  });

  const pdf = await pdfGenerators.generateWorldRecordPDF(
    language,
    {
      name: item.name!,
      specs: item.specs!,
      date: date.formal,
      recordType: item.recordType!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateAthleticAward = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getAthleticAwards({ certId: certificateId }))[0];

  const date = formatCertificateDate(item.date!);
  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name} ${item.surname}" has a valid ATHLETIC AWARD certificate for the contest "${item.competitionName}"`,
  });

  const pdf = await pdfGenerators.generateAthleticAwardPDF(
    language,
    {
      representing: item.representing!,
      rank: item.rank!,
      competitionName: item.competitionName!,
      location: item.location!,
      dateOfFinals: date.formal!,
      contestSize: item.contestSize!,
      discipline: item.discipline!,
      category: item.category!,
      fullname: `${item.name} ${item.surname}`,
    },
    verificationUrl,
  );
  return pdf;
};

const generateAthleteExcellenceAward = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getAthleteExcellences({ certId: certificateId }))[0];

  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name} ${item.surname}" has a valid ATHLETE EXCELLENCE certificate for the year "${item.year}"`,
  });

  const pdf = await pdfGenerators.generateAthleteExellencePDF(
    language,
    {
      fullname: `${item.name} ${item.surname}`,
      representing: item.representing!,
      year: item.year!,
      rank: item.rank!,
      category: item.category!,
      discipline: item.discipline!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateISAMembership = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getISAMembers({ certId: certificateId }))[0];

  const date = formatCertificateDate(item.date!);

  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name}" has a valid ISA MEMBER`,
  });

  const pdf = await pdfGenerators.generateIsaMembershipPDF(
    language,
    {
      name: item.name!,
      date: date.formal!,
      location: item.location!,
      membership: item.membership!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateHonoraryMember = async (payload: GenerateCertificatePayload) => {
  const { certificateId, language } = payload;
  const item = (await certificateSpreadsheet.getHonoraryMembers({ certId: certificateId }))[0];

  const pdf = await pdfGenerators.generateHonoraryMemberPDF(language, {
    fullname: item.name!,
    date: item.date!,
  });
  return pdf;
};

const generateContestOrganizer = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getContestOrganizers({ certId: certificateId }))[0];

  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name} ${item.surname}" has a valid CONTEST ORGANIZER certificate for the contest "${item.contestName}" in "${item.location}"`,
  });

  const pdf = await pdfGenerators.generateContestOrganizerPDF(
    language,
    {
      fullname: `${item.name} ${item.surname}`,
      contestName: item.contestName!,
      contestSize: item.contestSize!,
      location: item.location!,
      date: item.date!,
      discipline: item.discipline!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateISAPartnership = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getISAPartners({ certId: certificateId }))[0];

  const date = formatCertificateDate(item.date!);

  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name}" has a ${item.membership} of ISA`,
  });

  const pdf = await pdfGenerators.generateIsaPartnershipPDF(
    language,
    {
      name: item.name!,
      date: date.formal!,
      location: item.location!,
      membership: item.membership!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateApprovedGear = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getApprovedGears({ certId: certificateId }))[0];

  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.brand}" has a ISA certified gear for "${item.modelName}"`,
  });

  const pdf = await pdfGenerators.generateApprovedGearPDF(
    language,
    {
      brand: item.brand!,
      manualLink: item.manualLink!,
      modelName: item.modelName!,
      modelVersion: item.modelVersion!,
      productLink: item.productLink!,
      releaseYear: item.releaseYear!,
      productType: item.productType!,
      standard: item.standard!,
      standardVersion: item.standardVersion!,
      testingLab: item.testingLaboratory!,
      testDate: item.testDate!,
    },
    verificationUrl,
  );
  return pdf;
};

const generateWorldFirst = async (payload: GenerateCertificatePayload) => {
  const { certificateId, subject, language, skipQRCode } = payload;
  const item = (await certificateSpreadsheet.getWorldFirsts({ certId: certificateId }))[0];

  const date = formatCertificateDate(item.date!);
  const { verificationUrl } = await signCertificate({
    subject,
    skipQRCode,
    content: `"${item.name}" has a valid WORLD FIRST certificate for "${item.category}" achieved on ${date.pretty}`,
  });

  const pdf = await pdfGenerators.generateWorldFirstPDF(
    language,
    {
      name: item.name!,
      specs: item.specs!,
      date: date.formal,
      description: item.description!,
    },
    verificationUrl,
  );
  return pdf;
};
