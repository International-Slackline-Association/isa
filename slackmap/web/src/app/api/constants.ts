import { countryISO2Mapping } from 'utils/countryCodes';

const baseAppDataUrl = 'https://data.slackmap.com';

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
