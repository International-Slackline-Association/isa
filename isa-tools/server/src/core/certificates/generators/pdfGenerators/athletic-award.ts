import { PDFDocument } from 'pdf-lib';

import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, embedQRCodeToPDF, loadPDFTemplate } from './utils';

interface Props {
  fullname: string;
  representing: string;
  rank: string;
  competitionName: string;
  location: string;
  dateOfFinals: string;
  contestSize: string;
  category: string;
  discipline: string;
}

export async function generate(
  language: string,
  data: Props,
  qrCodeUrl: string,
): Promise<PDFDocument> {
  const blankPDF = blankPDFTemplate('athletic-award', language);

  const { boldFont, berkshireFont, page, pageHeight, pageWidth, pdfDoc, semiboldFont } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    fullname: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.fullname, 36) / 2,
      y: convertToYCoordinate(176, pageHeight, berkshireFont, 36),
    },
    representing: {
      size: 21,
      font: boldFont,
      color: black,
      x: pageWidth / 2 - boldFont.widthOfTextAtSize(data.representing, 21) / 2,
      y: convertToYCoordinate(248, pageHeight, boldFont, 21),
    },
    rank: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(282, pageHeight, semiboldFont, 12),
    },
    competitionName: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(297, pageHeight, semiboldFont, 12),
    },
    location: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(312, pageHeight, semiboldFont, 12),
    },
    dateOfFinals: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(326, pageHeight, semiboldFont, 12),
    },
    contestSize: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(341, pageHeight, semiboldFont, 12),
    },
    category: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(355, pageHeight, semiboldFont, 12),
    },
    discipline: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(370, pageHeight, semiboldFont, 12),
    },
  };

  for (const [key, value] of Object.entries(modifications)) {
    page.drawText(data[key as keyof Props], {
      ...value,
    });
  }

  if (qrCodeUrl) {
    await embedQRCodeToPDF(pdfDoc, qrCodeUrl, {
      x: 696,
      y: 438,
    });
  }

  return pdfDoc;
}
