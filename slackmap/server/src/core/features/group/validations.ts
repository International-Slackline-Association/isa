import countriesJson from '../../../../data/countryInfoDict.json';
import { FeatureCollection, Point } from 'geojson';

export const validateGroupGeoJson = (geoJson: FeatureCollection) => {
  const feature = geoJson.features[0];
  if (geoJson.features.length !== 1 || feature?.geometry?.type !== 'Point') {
    throw new Error('Validation: A group must have exactly 1 point');
  }
  const [lng, lat] = (feature.geometry as Point).coordinates;
  if (!(Math.abs(lng) <= 180 && Math.abs(lat) <= 90) || (lng === 0 && lat === 0)) {
    throw new Error('Validation: Invalid coordinates');
  }
  return true;
};

export const validateGroupCountry = (country: string) => {
  if (!countriesJson[country as keyof typeof countriesJson]) {
    throw new Error(`Validation: Groups in ${country} are not supported yet`);
  }
  return country;
};
