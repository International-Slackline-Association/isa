import { PDFDocument } from 'pdf-lib';

import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, embedQRCodeToPDF, loadPDFTemplate } from './utils';

interface Props {
  brand: string;
  modelName: string;
  modelVersion: string;
  releaseYear: string;
  productLink: string;
  manualLink: string;
  testingLab: string;
  testDate: string;
  productType: string;
  standard: string;
  standardVersion: string;
}

export async function generate(
  language: string,
  data: Props,
  qrCodeUrl: string,
): Promise<PDFDocument> {
  const blankPDF = blankPDFTemplate('approved-gear', language);

  const { boldFont, berkshireFont, page, pageHeight, pageWidth, pdfDoc, semiboldFont } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    modelName: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.modelName, 36) / 2,
      y: convertToYCoordinate(176, pageHeight, berkshireFont, 36),
    },
    brand: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(232, pageHeight, semiboldFont, 16),
    },
    modelVersion: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(251, pageHeight, semiboldFont, 16),
    },
    releaseYear: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(269, pageHeight, semiboldFont, 16),
    },
    standard: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(292, pageHeight, boldFont, 16),
    },
    productType: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(316, pageHeight, boldFont, 16),
    },
    testingLab: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(335, pageHeight, boldFont, 16),
    },
    testDate: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 260,
      y: convertToYCoordinate(354, pageHeight, boldFont, 16),
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
