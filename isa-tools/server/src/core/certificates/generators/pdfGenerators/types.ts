import { PDFFont, RGB } from 'pdf-lib';

export type PDFModificationsObject<T> = {
  [P in keyof Partial<T>]: {
    size: number;
    font: PDFFont;
    color: RGB;
    x: number;
    y: number;
  };
};
