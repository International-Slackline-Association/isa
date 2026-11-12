import { createHandler } from '../http';
import { activityRoutes } from './endpoints/activity/api';
import { communitiesRoutes } from './endpoints/communities/api';
import { contactRoutes } from './endpoints/contact/api';
import { countryRoutes } from './endpoints/country/api';
import { featureRoutes } from './endpoints/feature/api';
import { guideRoutes } from './endpoints/guide/api';
import { lineRoutes } from './endpoints/line/api';
import { spotRoutes } from './endpoints/spot/api';

export const main = createHandler('api', {
  ...lineRoutes,
  ...spotRoutes,
  ...guideRoutes,
  ...featureRoutes,
  ...countryRoutes,
  ...activityRoutes,
  ...communitiesRoutes,
  ...contactRoutes,
});
