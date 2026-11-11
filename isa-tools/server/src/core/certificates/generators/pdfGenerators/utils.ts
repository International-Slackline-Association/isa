import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

import berkshireTTF from './fonts/BerkshireSwash-Regular.ttf';
import boldTTF from './fonts/Montserrat-Bold.ttf';
import regularTTF from './fonts/Montserrat-Regular.ttf';
import semiboldTTF from './fonts/Montserrat-SemiBold.ttf';

export const isaRed = rgb(237 / 255, 80 / 255, 53 / 255);
export const isaBlue = rgb(0 / 255, 160 / 255, 153 / 255);
export const black = rgb(35 / 255, 31 / 255, 32 / 255);

export const loadPDFTemplate = async (blankPDF: string) => {
  const pdfDoc = await PDFDocument.load(blankPDF);

  pdfDoc.registerFontkit(fontkit);
  const { regularFont, semiboldFont, boldFont, berkshireFont } = await embedFonts(pdfDoc);

  const pages = pdfDoc.getPages();
  const page = pages[0];
  const pageHeight = page.getSize().height;
  const pageWidth = page.getSize().width;

  return {
    pdfDoc,
    regularFont,
    semiboldFont,
    boldFont,
    berkshireFont,
    page,
    pageHeight,
    pageWidth,
  };
};

export const convertToYCoordinate = (
  y: number,
  height: number,
  font: PDFFont,
  fontSize: number,
) => {
  return height - (y + fontSize / 2);
};

export const embedQRCodeToPDF = async (
  pdfDoc: PDFDocument,
  url: string,
  point: { x: number; y: number },
) => {
  const dataUrl = await createQRCode(url);
  const qrImage = await pdfDoc.embedPng(dataUrl);
  const page = pdfDoc.getPages()[0];

  page.drawImage(qrImage, {
    x: point.x,
    y: page.getSize().height - (point.y + qrImage.height),
    width: qrImage.width,
    height: qrImage.height,
  });
};

const createQRCode = async (url: string) => {
  return QRCode.toDataURL(url, {
    width: 60,
    margin: 1,
    errorCorrectionLevel: 'H',
  });
};

const embedFonts = async (pdfDoc: PDFDocument) => {
  const regularFont = await pdfDoc.embedFont(regularTTF);
  const semiboldFont = await pdfDoc.embedFont(semiboldTTF);
  const boldFont = await pdfDoc.embedFont(boldTTF);
  const berkshireFont = await pdfDoc.embedFont(berkshireTTF);
  return { regularFont, semiboldFont, boldFont, berkshireFont };
};
