import cors from 'cors';
import { Express, default as express, json, urlencoded } from 'express';

import { certificateApi } from './endpoints/certificate-api';
import { listingsApi } from './endpoints/listings-api';
import { signApi } from './endpoints/sign-api';
import {
  errorMiddleware,
  injectCommonlyUsedHeadersMiddleware,
  notFoundMiddleware,
} from './middlewares';

const app = express();

const setupExpressApp = (app: Express) => {
  app.use(cors());
  app.use(json());
  app.use(
    urlencoded({
      extended: true,
    }),
  );
};

const setupRoutes = (app: Express) => {
  app.use('/sheets/certificate', certificateApi);
  app.use('/sheets/list', listingsApi);
  app.use('/sign', signApi);
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
