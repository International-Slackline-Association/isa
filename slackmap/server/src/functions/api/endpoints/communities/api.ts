import { db } from '../../../../core/db';
import countriesJson from '../../../../../data/countryInfoDict.json';

import { Request } from '../../../http';
import { jsonRoute } from '../../utils';
import { groupResponse } from '../group/dto';

export const getCommunityCountryDetails = async (req: Request) => {
  const countryCode = req.params.code.toUpperCase();
  const countryInfo = countriesJson[countryCode as keyof typeof countriesJson];
  if (!countryInfo) {
    throw new Error(`NotFound: Country ${countryCode} not found`);
  }

  const groups = (await db.getGroupsOfCountry(countryCode))
    .map(groupResponse)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    name: countryInfo.name,
    isaMembers: groups.filter((g) => g.isaMembership),
    slacklineGroups: groups.filter((g) => !g.isaMembership),
  };
};

export const communitiesRoutes = {
  'GET /communities/country/:code': jsonRoute(getCommunityCountryDetails),
};
