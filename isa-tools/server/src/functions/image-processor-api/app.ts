import {
  errorMiddleware,
  injectCommonlyUsedHeadersMiddleware,
  notFoundMiddleware,
} from '@functions/image-processor-api/middlewares';
import cors from 'cors';
import { Express, default as express, json, urlencoded } from 'express';

import { api } from './api';

const app = express();

const setupExpressApp = (app: Express) => {
  app.use(json({ limit: '5mb' }));
  app.use(cors());
  app.use(
    urlencoded({
      extended: true,
      limit: '5mb',
    }),
  );
};

const setupRoutes = (app: Express) => {
  app.use('/process', api);
};

const registerStartingMiddlewares = (app: Express) => {
  app.use(injectCommonlyUsedHeadersMiddleware);
};

const registerEndingMiddlewares = (app: Express) => {
  app.use(errorMiddleware);
  app.use(notFoundMiddleware);
};

setupExpressApp(app);
registerStartingMiddlewares(app);
setupRoutes(app);
registerEndingMiddlewares(app);

export default app;
