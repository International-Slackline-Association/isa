import { PDFDocument } from 'pdf-lib';

import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, embedQRCodeToPDF, loadPDFTemplate } from './utils';

interface Props {
  fullname: string;
  contestName: string;
  location: string;
  date: string;
  discipline: string;
  contestSize: string;
}

export async function generate(
  language: string,
  data: Props,
  qrCodeUrl: string,
): Promise<PDFDocument> {
  const blankPDF = blankPDFTemplate('contest-organizer', language);

  const { berkshireFont, page, pageHeight, pageWidth, pdfDoc, semiboldFont } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    fullname: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.fullname, 36) / 2,
      y: convertToYCoordinate(176, pageHeight, 36),
    },
    contestName: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(272, pageHeight, 12),
    },
    location: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(291, pageHeight, 12),
    },
    date: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(310, pageHeight, 12),
    },
    discipline: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(329, pageHeight, 12),
    },
    contestSize: {
      size: 12,
      font: semiboldFont,
      color: black,
      x: 430,
      y: convertToYCoordinate(348, pageHeight, 12),
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
