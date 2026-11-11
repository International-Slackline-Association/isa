import { PDFDocument } from 'pdf-lib';

import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, embedQRCodeToPDF, loadPDFTemplate } from './utils';

interface Props {
  membership: string;
  name: string;
  date: string;
  location: string;
}

export async function generate(
  language: string,
  data: Props,
  qrCodeUrl: string,
): Promise<PDFDocument> {
  const blankPDF = blankPDFTemplate('isa-partnership', language);

  const { boldFont, berkshireFont, page, pageHeight, pageWidth, pdfDoc } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    name: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.name, 36) / 2,
      y: convertToYCoordinate(176, pageHeight, berkshireFont, 36),
    },
    membership: {
      size: 21,
      font: boldFont,
      color: black,
      x: pageWidth / 2 - boldFont.widthOfTextAtSize(data.membership, 21) / 2,
      y: convertToYCoordinate(260, pageHeight, boldFont, 21),
    },
    date: {
      size: 16,
      font: boldFont,
      color: black,
      x: 310,
      y: convertToYCoordinate(368, pageHeight, boldFont, 16),
    },
    location: {
      size: 16,
      font: boldFont,
      color: black,
      x: 440,
      y: convertToYCoordinate(368, pageHeight, boldFont, 16),
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
