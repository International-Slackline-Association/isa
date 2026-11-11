import { createHandler } from '../http';
import { processImage } from './api';

export const main = createHandler(
  'image-processor-api',
  { 'POST /process': processImage },
  () => '404 Not Found',
);
