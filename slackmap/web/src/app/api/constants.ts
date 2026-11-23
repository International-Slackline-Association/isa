import { stages } from 'stages';
import { countryISO2Mapping } from 'utils/countryCodes';

export const stage = import.meta.env.VITE_APP_STAGE;
export const { domain, webOrigins, uploadsIdentityPoolId, sessionRequired, passes } = stages[stage];
export const apiBaseUrl = import.meta.env.DEV ? `${window.location.origin}/_api` : `https://api.${domain}`;
export const dataBaseUrl = import.meta.env.DEV ? `${window.location.origin}/_data` : `https://data.${domain}`;
export const imagesBaseUrl = `https://images.${domain}`;
const baseAppDataUrl = dataBaseUrl;

export const geoJsonURL = {
  linePoints: baseAppDataUrl + '/geojson/lines/points.geojson',
  lines: baseAppDataUrl + '/geojson/lines/all.geojson',
  spotPoints: baseAppDataUrl + '/geojson/spots/points.geojson',
  spots: baseAppDataUrl + '/geojson/spots/all.geojson',
  guidePoints: baseAppDataUrl + '/geojson/guides/points.geojson',
  guides: baseAppDataUrl + '/geojson/guides/all.geojson',
  clustersAll: baseAppDataUrl + '/geojson/clusters/all.geojson',
  countryPoints: baseAppDataUrl + '/geojson/countries/points.geojson',
  countryPolygons: (code: string) =>
    `https://raw.githubusercontent.com/AshKyd/geojson-regions/master/countries/10m/${countryISO2Mapping[code]}.geojson`,
  groups: baseAppDataUrl + '/geojson/groups/points.geojson',
  communityCountries: baseAppDataUrl + '/geojson/groups/countries.geojson',
};
