import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  MapGeoJSONFeature,
  NavigationControl,
  Map as ReactMapGL,
} from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';

import { Box } from '@mui/material';

import { appActions } from 'app/slices/app';
import { mapControlsSx } from 'styles/theme/panelTheme';

import type { FeatureCollection } from 'geojson';

import { GeolocateButton } from '../Components/GeolocateButton';
import { MapTermsNote } from '../Components/TermsNote';
import { MapImage } from '../Components/MapImage';
import { MapDataLoadingIndicator } from '../Components/MapDataLoadingIndicator';
import { MapLoadingPlaceholder } from '../Components/MapLoadingPlaceholder';
import { defaultMapSettings, defaultMapViewState } from '../constants';
import { useActiveFeature } from '../hooks/useActiveFeature';
import { useActiveFeatureGeoJson } from '../hooks/useActiveFeatureGeoJson';
import { useHoveredFeature } from '../hooks/useHoveredFeature';
import { useMapEvents } from '../hooks/useMapEvents';
import { useMapStyle } from '../hooks/useMapStyle';
import { useSelectedFeature } from '../hooks/useSelectedFeature';
import { useZoomToUserLocationOnMapLoad } from '../hooks/useZoomToUserLocation';
import { isMouseHoverableLayer } from '../layers';
import { CountryLayerIds } from '../layers/countryLayers';
import { SlacklineGroupsLayerIds } from '../layers/slacklineGroupsLayer';
import { CommunityMapSourceIds, CommunityMapSources } from '../sources/commnunityMapSources';
import { MapFeatureEntity } from '../types';
import { safeArea } from 'styles/theme/ui';

interface Props {
  onSelectedFeatureChange?: (feature?: MapGeoJSONFeature) => void;
  activeCommunityFeature?: MapFeatureEntity<CommunityMapFeatureType>;
  activeCommunityFeatureGeoJson?: FeatureCollection;
}

export const CommunityMap = (props: Props) => {
  const mapRef = useRef<MapRef>(null);
  const dispatch = useDispatch();
  const [zoomLevel, setZoomLevel] = useState<number>();

  const { projection, mapStyle } = useMapStyle(zoomLevel, {});

  const { setHoveredFeature, setHoveredMapboxFeature } = useHoveredFeature(mapRef);
  const { setSelectedMapboxFeature, setSelectedFeature, selectedFeature } =
    useSelectedFeature(mapRef);
  const { isMapLoaded, onMapLoad, onMouseMove, onMapClick, cursor } = useMapEvents(mapRef, {
    onMouseMovedToFeature(feature) {
      if (isMouseHoverableLayer(feature.layer?.id)) {
        setHoveredMapboxFeature(feature);
      }
    },
    onMouseMovedToVoid() {
      setHoveredFeature(undefined);
    },
    onClickedToVoid() {
      setSelectedFeature(undefined);
      props.onSelectedFeatureChange?.(undefined);
    },
    onClickedToFeature(feature) {
      setSelectedMapboxFeature(feature);
      props.onSelectedFeatureChange?.(feature);
    },
  });

  useZoomToUserLocationOnMapLoad(mapRef, isMapLoaded, Boolean(props.activeCommunityFeatureGeoJson));

  useActiveFeature(
    mapRef,
    isMapLoaded,
    props.activeCommunityFeature,
    selectedFeature,
    setSelectedFeature,
  );

  useActiveFeatureGeoJson(mapRef, isMapLoaded, props.activeCommunityFeatureGeoJson, {
    paddingType: {
      padExplicityly: props.activeCommunityFeature?.type === 'communityCountry',
      padOnFit: true,
    },
    minBufferRadiusInKm: 100,
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...mapControlsSx,
        '& .mapboxgl-ctrl-logo': {
          display: 'none',
        },
        // On phones the panel's bar covers the bottom.
        '& .mapboxgl-ctrl-bottom-left': { marginBottom: { xs: `calc(56px + ${safeArea.bottom})`, lg: 0 }, marginLeft: 'var(--panel-inset, 0px)' },
        // and the add button sits above it.
        '& .mapboxgl-ctrl-bottom-right': { marginBottom: { xs: `calc(140px + ${safeArea.bottom})`, lg: 0 }, marginRight: 'var(--card-inset, 0px)' },
      }}
    >
      {!isMapLoaded && <MapLoadingPlaceholder pad={Boolean(props.activeCommunityFeature)} />}
      <MapDataLoadingIndicator
        mapRef={mapRef}
        isMapLoaded={isMapLoaded}
        sourceId={CommunityMapSourceIds.slacklineGroups}
      />
      <MapTermsNote />
      <ReactMapGL
        {...defaultMapSettings}
        initialViewState={defaultMapViewState}
        mapStyle={mapStyle}
        interactiveLayerIds={[SlacklineGroupsLayerIds.groupPoint, CountryLayerIds.countryPoint]}
        onLoad={onMapLoad}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        cursor={cursor}
        ref={mapRef}
        projection={projection}
        onZoom={(e) => {
          setZoomLevel(e.viewState.zoom);
        }}
        onMoveEnd={(e) => {
          const { longitude, latitude, zoom } = e.viewState;
          dispatch(appActions.updateLastMapLocation({ longitude, latitude, zoom }));
        }}
      >
        <GeolocateButton />
        <NavigationControl position="bottom-right" showCompass={false} />
        <MapImage name={'slackmap-country-symbol'} url={'/images/country-symbol.png'} />
        <CommunityMapSources
          filter={{
            country:
              props.activeCommunityFeature?.type === 'communityCountry'
                ? props.activeCommunityFeature?.id
                : undefined,
          }}
        />
      </ReactMapGL>
    </Box>
  );
};
