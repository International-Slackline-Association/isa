import { RefObject, useEffect } from 'react';
import { MapRef } from 'react-map-gl/mapbox';

import { getSlacklinePointOfFeature } from 'app/api/geojson-data';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

import { MapFeatureEntity } from '../types';
import { HoveredFeatureEntity } from './useHoveredFeature';

// Waits a moment so moving the mouse across a list does not swing the map at every item.
const panDelayMs = 300;

export const useHighlightedFeature = (
  mapRef: RefObject<MapRef | null>,
  isMapLoaded: boolean,
  highlightedFeature: MapFeatureEntity | undefined,
  hoveredFeature: HoveredFeatureEntity | undefined,
  onShouldUpdateHoveredFeature: (feature: HoveredFeatureEntity | undefined) => void,
) => {
  const { isDesktop } = useMediaQuery();
  useEffect(() => {
    if (highlightedFeature && hoveredFeature?.id !== highlightedFeature.id && isMapLoaded) {
      onShouldUpdateHoveredFeature({
        id: highlightedFeature.id,
        type: highlightedFeature.type,
        size: 'large',
      });
    }

    if (!highlightedFeature) {
      if (hoveredFeature) {
        onShouldUpdateHoveredFeature(undefined);
      }
    }
  }, [highlightedFeature]);

  useEffect(() => {
    if (!highlightedFeature || !isMapLoaded || !isDesktop) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const point = await getSlacklinePointOfFeature(highlightedFeature.id);
      if (cancelled || !point) return;
      mapRef.current?.easeTo({ center: [point[0], point[1]], duration: 800 });
    }, panDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [highlightedFeature, isMapLoaded]);
};
