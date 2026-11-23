import { RefObject, useEffect } from 'react';
import { MapRef } from 'react-map-gl/mapbox';

import { FeatureCollection } from 'geojson';
import { usePanelInset } from 'app/components/AppPanel/panelInset';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

import { MAP_PADDING_RIGHT_FOR_FEATURE_CARD, mapPaddingBottomForFeatureSheet } from '../constants';
import { fitMapToGeoJson, padMapTo } from '../mapUtils';

export const useActiveFeatureGeoJson = (
  mapRef: RefObject<MapRef | null>,
  isMapLoaded: boolean,
  activeFeatureGeoJson: FeatureCollection | undefined,
  opts: {
    paddingType: {
      padExplicityly?: boolean;
      padOnFit?: boolean;
    };
    minBufferRadiusInKm?: number;
  },
) => {
  const { isDesktop } = useMediaQuery();
  const leftPadding = usePanelInset();

  useEffect(() => {
    if (activeFeatureGeoJson) {
      const rightPadding = isDesktop ? MAP_PADDING_RIGHT_FOR_FEATURE_CARD : 0;
      const padding = {
        top: 0,
        left: leftPadding,
        bottom: isDesktop ? 0 : mapPaddingBottomForFeatureSheet(),
        right: rightPadding,
      };
      const current = mapRef.current?.getPadding();
      const currentPadding = current && (current.right || current.bottom);

      if (opts.paddingType.padExplicityly) {
        if ((padding.right || padding.bottom) && !currentPadding) {
          padMapTo(mapRef, padding, { animate: false });
        }
        fitMapToGeoJson(mapRef, activeFeatureGeoJson, {
          animation: {
            skip: !isMapLoaded,
          },
          minBufferRadiusInKm: opts.minBufferRadiusInKm,
        });
      } else {
        if (currentPadding) {
          padMapTo(mapRef, { left: leftPadding }, { animate: false });
        }
        fitMapToGeoJson(mapRef, activeFeatureGeoJson, {
          animation: {
            skip: !isMapLoaded,
          },
          padding: opts.paddingType.padOnFit ? padding : undefined,
          minBufferRadiusInKm: opts.minBufferRadiusInKm,
        });
      }
    } else {
      padMapTo(mapRef, { left: leftPadding });
    }
  }, [activeFeatureGeoJson, isDesktop, isMapLoaded]);

  // Folding the panel only moves the map's padding; it does not refit to the feature again.
  useEffect(() => {
    if (!mapRef.current) return;
    padMapTo(mapRef, { ...mapRef.current.getPadding(), left: leftPadding });
  }, [leftPadding]);
};
