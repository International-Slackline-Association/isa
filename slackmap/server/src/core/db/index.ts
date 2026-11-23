import { countryChangelogCollection } from './collections/featureChangelogCollection';
import { groupDetailsDB } from './entities/group/details';
import { guideDetailsDB } from './entities/guide/details';
import { lineDetailsDB } from './entities/line/details';
import { lineActivationDB } from './entities/line/activation';
import { passDB } from './entities/pass';
import { mapFeatureChangelogDB } from './entities/mapFeature/changelog';
import { mapFeatureDB } from './entities/mapFeature/editor';
import { spotDetailsDB } from './entities/spot/details';
import { contributorAgreementDB } from './entities/user/agreement';

export const db = {
  ...countryChangelogCollection,
  ...groupDetailsDB,
  ...guideDetailsDB,
  ...lineDetailsDB,
  ...lineActivationDB,
  ...passDB,
  ...mapFeatureChangelogDB,
  ...mapFeatureDB,
  ...spotDetailsDB,
  ...contributorAgreementDB,
};
