import { createHandler } from '../http';
import { activityRoutes } from './endpoints/activity/api';
import { communitiesRoutes } from './endpoints/communities/api';
import { contactRoutes } from './endpoints/contact/api';
import { countryRoutes } from './endpoints/country/api';
import { featureRoutes } from './endpoints/feature/api';
import { groupRoutes } from './endpoints/group/api';
import { guideRoutes } from './endpoints/guide/api';
import { lineRoutes } from './endpoints/line/api';
import { meRoutes, requireAgreement } from './endpoints/me/api';
import { pageRoutes } from './endpoints/page/api';
import { activationRoutes, signedInActivationRoutes } from './endpoints/activation/api';
import { sessionRoutes } from './endpoints/session/api';
import { spotRoutes } from './endpoints/spot/api';

export const main = createHandler(
  'api',
  {
    ...requireAgreement(lineRoutes),
    ...requireAgreement(spotRoutes),
    ...requireAgreement(guideRoutes),
    ...requireAgreement(groupRoutes),
    ...requireAgreement(featureRoutes),
    ...requireAgreement(signedInActivationRoutes),
    ...countryRoutes,
    ...activityRoutes,
    ...communitiesRoutes,
    ...contactRoutes,
    ...pageRoutes,
    ...sessionRoutes,
    ...meRoutes,
  },
  activationRoutes,
);
