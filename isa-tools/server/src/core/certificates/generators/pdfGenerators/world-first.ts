import { blankPDFTemplate } from './templates';
import { PDFModificationsObject } from './types';
import { black, convertToYCoordinate, embedQRCodeToPDF, loadPDFTemplate } from './utils';

interface Props {
  description: string;
  specs: string;
  name: string;
  date: string;
}

export async function generate(language: string, data: Props, qrCodeUrl?: string) {
  const blankPDF = blankPDFTemplate('world-first', language);

  const { boldFont, page, pageHeight, pageWidth, pdfDoc, semiboldFont, berkshireFont } =
    await loadPDFTemplate(blankPDF);

  const modifications: PDFModificationsObject<Props> = {
    name: {
      size: 36,
      font: berkshireFont,
      color: black,
      x: pageWidth / 2 - berkshireFont.widthOfTextAtSize(data.name, 36) / 2,
      y: convertToYCoordinate(172, pageHeight, berkshireFont, 36),
    },
    description: {
      size: 16,
      font: boldFont,
      color: black,
      x: pageWidth / 2 - boldFont.widthOfTextAtSize(data.description, 16) / 2,
      y: convertToYCoordinate(269, pageHeight, boldFont, 16),
    },
    specs: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 422,
      y: convertToYCoordinate(312, pageHeight, semiboldFont, 16),
    },
    date: {
      size: 16,
      font: semiboldFont,
      color: black,
      x: 422,
      y: convertToYCoordinate(343, pageHeight, semiboldFont, 16),
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
