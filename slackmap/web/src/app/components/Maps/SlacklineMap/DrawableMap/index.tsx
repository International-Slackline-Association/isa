import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Map as ReactMapGL, ViewState } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';

import { MapboxDrawControls } from '@mapbox/mapbox-gl-draw';
import { Feature, FeatureCollection } from 'geojson';

import { MapImage } from '../../Components/MapImage';
import { MapLoadingPlaceholder } from '../../Components/MapLoadingPlaceholder';
import { MAPBOX_TOKEN, defaultMapSettings, defaultMapViewState } from '../../constants';
import { useMapStyle } from '../../hooks/useMapStyle';
import { fitMapToGeoJson } from '../../mapUtils';
import { SlacklineMapSources } from '../../sources/slacklineMapSources';
import { GeocoderControl } from '../geocoderControl';
import { useMapOptions } from '../useMapOptions';
import { DrawControl, MapboxDrawEvent } from './DrawControl';

const featuresDict = (features: Feature[]) => {
  const dict: Record<string, Feature> = {};
  for (const f of features) {
    if (f.id) {
      dict[f.id] = f;
    }
  }
  return dict;
};

const featuresArray = (features: Record<string, Feature>) => {
  const array: Feature[] = [];
  for (const f of Object.values(features)) {
    if (f.id) {
      array.push(f);
    }
  }
  return array;
};

const featureCollection = (features: Feature[]): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features,
  };
};

interface Props {
  initialViewState?: Partial<ViewState>;
  drawControls: MapboxDrawControls;
  onDrawingFeaturesChanged: (features: Feature[]) => void;
  onSelectionChanged?: (feature?: Feature) => void;
  drawingFeatures?: Feature[];
  drawControlStyles: object[];
  sources?: React.ReactNode;
  showGeocoder?: boolean;
}

export const DrawableMap = (props: Props) => {
  const mapRef = useRef<MapRef>(null);
  const drawRef = React.useRef<MapboxDraw | undefined>(undefined);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(props.initialViewState?.zoom);

  const { selectedMapStyle } = useMapOptions();

  const { mapStyle, projection } = useMapStyle(zoomLevel, {
    style: selectedMapStyle,
  });

  const fitMapToCurrentGeoJson = useCallback(() => {
    if (!isMapLoaded || !props.drawingFeatures || !mapRef.current) return;

    fitMapToGeoJson(mapRef, featureCollection(props.drawingFeatures), {
      animation: {
        skip: true,
      },
    });
  }, [isMapLoaded, props.drawingFeatures]);

  const onMapLoad = () => {
    setIsMapLoaded(true);
    mapRef.current?.setPadding({ top: 0, left: 0, bottom: 0, right: 0 });
  };

  useEffect(() => {
    if (!isMapLoaded || !props.drawingFeatures || !mapRef.current) return;
    fitMapToCurrentGeoJson();

    const features = props.drawingFeatures.map((f) => {
      return {
        ...f,
        id: (Math.random() + 1).toString(36).substring(5),
      };
    });
    if (props.drawingFeatures?.length > 0 && drawRef.current) {
      const dict = featuresDict(features);
      const currentFeatures = drawRef.current?.getAll();
      for (const feature of currentFeatures?.features || []) {
        if (feature.id) {
          dict[feature.id] = feature;
        }
      }
      setTimeout(() => {
        drawRef.current?.set(featureCollection(featuresArray(dict)));
      }, 100);
    } else {
      drawRef.current?.deleteAll();
    }
  }, [isMapLoaded, props.drawingFeatures]);

  const onUpdate = useCallback((_e: MapboxDrawEvent) => {
    const currentFeatures = drawRef.current?.getAll();
    props.onDrawingFeaturesChanged(currentFeatures?.features || []);
  }, []);

  const onDelete = useCallback((_e: MapboxDrawEvent) => {
    const currentFeatures = drawRef.current?.getAll();
    props.onDrawingFeaturesChanged(currentFeatures?.features || []);
  }, []);

  return (
    <>
      {!isMapLoaded && <MapLoadingPlaceholder />}
      <ReactMapGL
        {...defaultMapSettings}
        initialViewState={props.initialViewState || defaultMapViewState}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        onZoom={(e) => {
          setZoomLevel(e.viewState.zoom);
        }}
        ref={mapRef}
        projection={projection as any}
      >
        <MapImage name={'slackmap-line-marker'} url={'/images/line-marker.png'} sdf />
        <MapImage name={'slackmap-country-symbol'} url={'/images/country-symbol.png'} />

        {isMapLoaded && (
          <DrawControl
            ref={drawRef}
            displayControlsDefault={false}
            controls={props.drawControls}
            defaultMode="simple_select"
            onCreate={onUpdate}
            onUpdate={onUpdate}
            onDelete={onDelete}
            styles={props.drawControlStyles}
          />
        )}

        {props.sources ?? (
          <SlacklineMapSources
            displayFeature={'all'}
            filter={{ id: (props.drawingFeatures || [])[0]?.properties?.id }}
          />
        )}
        {props.showGeocoder && (
          <GeocoderControl
            mapboxAccessToken={MAPBOX_TOKEN}
            position="top-left"
            placeholder="Search location..."
            marker={false}
            minLength={3}
          />
        )}
      </ReactMapGL>
    </>
  );
};
