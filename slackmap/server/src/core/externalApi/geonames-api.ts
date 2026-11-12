import { logger } from '../logger';

const username = process.env.GEONAMES_API_USERNAME || 'demo';

export const getCountryCode = async (lat: number, lng: number) => {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      style: 'short',
      username,
    });
    const response = await fetch(`http://api.geonames.org/findNearbyPlaceNameJSON?${params}`);
    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }
    const data = (await response.json()) as {
      geonames?: { countryCode?: string }[];
      status?: { message?: string };
    };
    const code = data.geonames?.[0]?.countryCode;
    if (!code) {
      throw new Error(data.status?.message);
    }
    return code;
  } catch (err) {
    logger.error('Error getting country code', { message: (err as Error).message });
    return undefined;
  }
};
