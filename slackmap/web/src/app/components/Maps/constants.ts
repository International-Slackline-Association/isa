import type { FogSpecification as Fog } from 'mapbox-gl';
import { dataBaseUrl } from 'app/api/constants';
import { appColors } from 'styles/theme/colors';

export const MAPBOX_TOKEN = import.meta.env.VITE_APP_SLACKMAP_MAPBOX_TOKEN;

export const defaultMapSettings = {
  mapboxAccessToken: MAPBOX_TOKEN,
  attributionControl: false,
  pitchWithRotate: false,
  maxPitch: 0,
  // The map data needs the session cookie, which a cross-origin request only sends when asked to.
  transformRequest: (url: string) =>
    url.startsWith(`${dataBaseUrl}/`)
      ? { url, credentials: 'include' as const }
      : { url },
  fog: {
    'horizon-blend': 0.05,
    color: appColors.slackmapBlue,
    'high-color': 'black',
  } as Fog,
};

export const defaultMapViewState = {
  latitude: 35.92263245263329,
  longitude: -39.41644394307363,
  zoom: 1,
  bearing: 0,
  pitch: 0,
};

// The floating card's width and its gap to the edge.
export const MAP_PADDING_RIGHT_FOR_FEATURE_CARD = Math.max(window.innerWidth * 0.3, 352) + 12;
// On phones the card is a sheet over the lower 60% of the map.
export const mapPaddingBottomForFeatureSheet = () => window.innerHeight * 0.6;

export const mapStyles = {
  streets: 'mapbox://styles/mapbox/streets-v11?optimize=true',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11?optimize=true',
  satellite: 'mapbox://styles/mapbox/satellite-v9?optimize=true',
  light: 'mapbox://styles/mapbox/light-v11?optimize=true',
  dark: 'mapbox://styles/mapbox/dark-v11?optimize=true',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11?optimize=true',
};
