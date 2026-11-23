import { useRef, useState } from 'react';
import {
  AttributionControl,
  GeolocateControl,
  MapGeoJSONFeature,
  NavigationControl,
  Map as ReactMapGL,
  ViewState,
  ViewStateChangeEvent,
} from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';

import { Box } from '@mui/material';

import type { FeatureCollection } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MapTermsNote } from '../Components/TermsNote';
import { MapImage } from '../Components/MapImage';
import { MapDataLoadingIndicator } from '../Components/MapDataLoadingIndicator';
import { MapLoadingPlaceholder } from '../Components/MapLoadingPlaceholder';
import { MAPBOX_TOKEN, defaultMapSettings, defaultMapViewState } from '../constants';
import { useActiveFeature } from '../hooks/useActiveFeature';
import { useActiveFeatureGeoJson } from '../hooks/useActiveFeatureGeoJson';
import { useHighlightedFeature } from '../hooks/useHighlightedFeature';
import { useHoveredFeature } from '../hooks/useHoveredFeature';
import { useMapEvents } from '../hooks/useMapEvents';
import { useMapStyle } from '../hooks/useMapStyle';
import { useSelectedFeature } from '../hooks/useSelectedFeature';
import { useZoomToUserLocationOnMapLoad } from '../hooks/useZoomToUserLocation';
import { cursorInteractableLayerIds, isMouseHoverableLayer } from '../layers';
import { SlacklineMapSourceIds, SlacklineMapSources } from '../sources/slacklineMapSources';
import { MapFeatureEntity } from '../types';
import { GeocoderControl } from './geocoderControl';
import { useMapOptions } from './useMapOptions';
import { mapControlsSx } from 'styles/theme/panelTheme';

interface Props {
  onMapMoveEnd?: (event: ViewStateChangeEvent) => void;
  initialViewState?: Partial<ViewState>;
  onSelectedFeatureChange?: (feature?: MapGeoJSONFeature) => void;
  activeSlacklineFeature?: MapFeatureEntity<SlacklineMapFeatureType>;
  highlightedSlacklineFeature?: MapFeatureEntity<SlacklineMapFeatureType>;
  activeSlacklineFeatureGeoJson?: FeatureCollection;
}

export const SlacklineMap = (props: Props) => {
  const mapRef = useRef<MapRef>(null);
  const [zoomLevel, setZoomLevel] = useState(props.initialViewState?.zoom);

  const {
    FilterChips,
    MapStyleControl,
    MapStyleMenu,
    selectedDisplayFeature,
    selectedLineType,
    selectedSpotType,
    selectedMapStyle,
  } =
    useMapOptions();

  const { mapStyle, projection } = useMapStyle(zoomLevel, {
    style: selectedMapStyle,
  });

  const { hoveredFeature, setHoveredMapboxFeature, setHoveredFeature } = useHoveredFeature(mapRef);
  const { selectedFeature, setSelectedFeature, setSelectedMapboxFeature } =
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
    onClickedToFeature(feature) {
      if (isMouseHoverableLayer(feature.layer?.id)) {
        setSelectedMapboxFeature(feature);
        props.onSelectedFeatureChange?.(feature);
      }
    },
  });
  useActiveFeature(
    mapRef,
    isMapLoaded,
    props.activeSlacklineFeature,
    selectedFeature,
    setSelectedFeature,
  );

  useHighlightedFeature(
    mapRef,
    isMapLoaded,
    props.highlightedSlacklineFeature,
    hoveredFeature,
    setHoveredFeature,
  );

  useZoomToUserLocationOnMapLoad(
    mapRef,
    isMapLoaded,
    Boolean(props.initialViewState) || Boolean(props.activeSlacklineFeature),
  );

  useActiveFeatureGeoJson(mapRef, isMapLoaded, props.activeSlacklineFeatureGeoJson, {
    paddingType: {
      padExplicityly:
        props.activeSlacklineFeature?.type === 'activity' ||
        props.activeSlacklineFeature?.type === 'country',
      padOnFit: true,
    },
    minBufferRadiusInKm: props.activeSlacklineFeature?.type === 'activity' ? 300 : undefined,
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        '& .mapboxgl-ctrl-top-left': {
          right: { xs: 0, lg: 'auto' },
        },
        '& .mapboxgl-ctrl-geocoder': {
          marginTop: '12px',
          marginLeft: 'calc(var(--panel-inset, 0px) + 12px)',
          width: { xs: 'calc(100vw - 24px)', lg: '300px' },
          maxWidth: 'none',
        },
        '& .mapboxgl-ctrl-geocoder--input': {
          height: '38px',
          fontSize: { xs: '16px', lg: '14px' },
        },
        '& .mapboxgl-ctrl-geocoder--icon-search': {
          height: '16px',
          top: '11px',
        },

        ...mapControlsSx,
        '& .mapboxgl-ctrl-logo': {
          display: 'none',
        },
        // On phones the panel's bar covers the bottom 56px.
        '& .mapboxgl-ctrl-bottom-left': { marginBottom: { xs: '56px', lg: 0 }, marginLeft: 'var(--panel-inset, 0px)' },
        // and the add button sits above it.
        '& .mapboxgl-ctrl-bottom-right': { marginBottom: { xs: '140px', lg: 0 }, marginRight: 'var(--card-inset, 0px)' },
      }}
    >
      {!isMapLoaded && <MapLoadingPlaceholder pad={Boolean(props.activeSlacklineFeature)} />}
      <MapDataLoadingIndicator
        mapRef={mapRef}
        isMapLoaded={isMapLoaded}
        sourceId={SlacklineMapSourceIds.linePoints}
      />
      <MapTermsNote />
      {FilterChips}
      {MapStyleMenu}
      <ReactMapGL
        {...defaultMapSettings}
        initialViewState={props.initialViewState || defaultMapViewState}
        mapStyle={mapStyle}
        interactiveLayerIds={cursorInteractableLayerIds}
        onLoad={onMapLoad}
        onClick={onMapClick}
        onMoveEnd={props.onMapMoveEnd}
        onMouseMove={onMouseMove}
        cursor={cursor}
        onZoom={(e) => {
          setZoomLevel(e.viewState.zoom);
        }}
        ref={mapRef}
        projection={projection}
      >
        <GeolocateControl position="bottom-right" />
        <AttributionControl compact customAttribution="International Slackline Association" />
        <NavigationControl position="bottom-right" showCompass={false} />
        {MapStyleControl}
        <GeocoderControl
          mapboxAccessToken={MAPBOX_TOKEN}
          position="top-left"
          placeholder="Search location..."
          marker={false}
          minLength={3}
        />
        <MapImage name={'slackmap-line-marker'} url={'/images/line-marker.png'} sdf />
        <MapImage name={'slackmap-country-symbol'} url={'/images/country-symbol.png'} />

        <SlacklineMapSources
          displayFeature={selectedDisplayFeature}
          filter={{
            country:
              props.activeSlacklineFeature?.type === 'country'
                ? props.activeSlacklineFeature?.id
                : undefined,
            lineType: selectedLineType,
            spotType: selectedSpotType,
          }}
        />
      </ReactMapGL>
    </Box>
  );
};
