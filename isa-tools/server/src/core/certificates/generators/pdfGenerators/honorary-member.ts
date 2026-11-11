import { PDFDocument } from 'pdf-lib';

import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, loadPDFTemplate } from './utils';

interface Props {
  fullname: string;
  date: string;
}

export async function generate(language: string, data: Props): Promise<PDFDocument> {
  const blankPDF = blankPDFTemplate('honorary-member', language);

  const { berkshireFont, page, pageHeight, pageWidth, pdfDoc, semiboldFont } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    fullname: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.fullname, 36) / 2,
      y: convertToYCoordinate(190, pageHeight, berkshireFont, 36),
    },
    date: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 424,
      y: convertToYCoordinate(355, pageHeight, semiboldFont, 16),
    },
  };
  for (const [key, value] of Object.entries(modifications)) {
    page.drawText(data[key as keyof Props], {
      ...value,
    });
  }

  return pdfDoc;
}
