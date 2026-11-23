import { useSessionReady } from 'app/session';
import React, { useEffect } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';

import { SlacklineType, SpotType } from '@server/core/types';
import { geoJsonURL } from 'app/api/constants';

import { SelectedDisplayFeature } from '../SlacklineMap/useMapOptions';
import { countryPointLayer, countryPolygonOutlineLayer } from '../layers/countryLayers';
import {
  guideLabelLayer,
  guideLineStringLayer,
  guidePointLayer,
  guidePolygonLayer,
  guidePolygonOutlineLayer,
} from '../layers/guideLayers';
import {
  lineLabelLayer,
  lineLineStringLayer,
  linePointLayer,
  riggedLineHaloLayer,
  riggedPointHaloLayer,
} from '../layers/lineLayers';
import { spotPointLayer, spotPolygonLayer, spotPolygonOutlineLayer } from '../layers/spotLayers';

export const SlacklineMapSourceIds = {
  spots: 'spots',
  lines: 'lines',
  guides: 'guides',
  linePoints: 'linePoints',
  spotPoints: 'spotPoints',
  guidePoints: 'guidePoints',
  countryPoints: 'countryPoints',
  countriesOutlines: 'countriesOutlines',
} as const;

export const SlacklineMapSources = (props: {
  displayFeature: SelectedDisplayFeature;
  filter?: {
    id?: string;
    lineType?: SlacklineType;
    spotType?: SpotType;
    country?: string;
  };
}) => {
  const sessionReady = useSessionReady();
  const { displayFeature, filter } = props;

  const [idFilterExpr, setIdFilterExpr] = React.useState<any>();
  const [lineTypeFilterExpr, setLineTypeFilterExpr] = React.useState<any>();
  const [spotTypeFilterExpr, setSpotTypeFilterExpr] = React.useState<any>();
  const [countryFilterExpr, setCountryFilterExpr] = React.useState<any>();

  // A rig is shown until its 'ru' (rigged until, epoch seconds) passes; checked again every minute.
  const [nowSeconds, setNowSeconds] = React.useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(timer);
  }, []);
  const riggedFilterExpr = ['>', ['to-number', ['get', 'ru'], 0], nowSeconds];

  const options = {
    lines: displayFeature === 'line' || displayFeature === 'all' || displayFeature === 'rigged',
    spots: displayFeature === 'spot' || displayFeature === 'all',
    guides: displayFeature === 'guide' || displayFeature === 'all',
  };
  useEffect(() => {
    if (filter?.id) {
      setIdFilterExpr(['!=', ['get', 'id'], filter?.id]);
    } else {
      setIdFilterExpr(undefined);
    }
    if (filter?.lineType) {
      setLineTypeFilterExpr(['==', ['get', 'lt'], filter.lineType.substring(0, 1)]);
    } else {
      setLineTypeFilterExpr(undefined);
    }
    if (filter?.spotType) {
      setSpotTypeFilterExpr([
        'in',
        filter.spotType.substring(0, 1),
        ['coalesce', ['get', 'st'], ''],
      ]);
    } else {
      setSpotTypeFilterExpr(undefined);
    }
    if (filter?.country) {
      setCountryFilterExpr(['==', ['get', 'c'], filter.country]);
    } else {
      setCountryFilterExpr(undefined);
    }
  }, [filter]);

  const lineFilterExpr =
    displayFeature === 'rigged'
      ? ['all', riggedFilterExpr, lineTypeFilterExpr || true]
      : lineTypeFilterExpr;

  // The data needs the session cookie; the map draws without it until the browser check is done.
  if (!sessionReady) return null;

  return (
    <>
      <Source
        id={SlacklineMapSourceIds.spots}
        type="geojson"
        data={geoJsonURL.spots}
        generateId={true}
        promoteId="id"
        filter={idFilterExpr}
      >
        <Layer {...spotPolygonLayer({ visible: options.spots, filter: spotTypeFilterExpr })} />
        <Layer
          {...spotPolygonOutlineLayer({ visible: options.spots, filter: spotTypeFilterExpr })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.lines}
        type="geojson"
        data={geoJsonURL.lines}
        generateId
        promoteId="id"
        filter={idFilterExpr}
      >
        <Layer
          {...riggedLineHaloLayer({
            visible: options.lines,
            filter: ['all', riggedFilterExpr, lineTypeFilterExpr || true],
          })}
        />
        <Layer
          {...lineLineStringLayer({
            visible: options.lines,
            filter: lineFilterExpr,
          })}
        />
        <Layer
          {...lineLabelLayer({
            visible: options.lines,
            filter: lineFilterExpr,
          })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.guides}
        type="geojson"
        data={geoJsonURL.guides}
        generateId={true}
        promoteId="id"
        filter={idFilterExpr}
      >
        <Layer
          {...guidePointLayer({
            visible: options.guides,
          })}
        />
        <Layer
          {...guideLineStringLayer({
            visible: options.guides,
          })}
        />
        <Layer
          {...guidePolygonLayer({
            visible: options.guides,
          })}
        />
        <Layer
          {...guidePolygonOutlineLayer({
            visible: options.guides,
          })}
        />
        <Layer
          {...guideLabelLayer({
            visible: options.guides,
          })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.linePoints}
        type="geojson"
        data={geoJsonURL.linePoints}
        generateId
        promoteId="id"
      >
        <Layer
          {...riggedPointHaloLayer({
            visible: options.lines,
            filter: ['all', riggedFilterExpr, countryFilterExpr || true, lineTypeFilterExpr || true],
          })}
        />
        <Layer
          {...linePointLayer({
            visible: options.lines,
            filter: ['all', countryFilterExpr || true, lineFilterExpr || true],
          })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.spotPoints}
        type="geojson"
        data={geoJsonURL.spotPoints}
        generateId
        promoteId="id"
      >
        <Layer
          {...spotPointLayer({
            visible: options.spots,
            filter: ['all', countryFilterExpr || true, spotTypeFilterExpr || true],
          })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.guidePoints}
        type="geojson"
        data={geoJsonURL.guidePoints}
        generateId
        promoteId="id"
      >
        <Layer
          {...guidePointLayer({
            visible: options.guides,
            isGlobalView: true,
            filter: countryFilterExpr,
          })}
        />
      </Source>

      <Source
        id={SlacklineMapSourceIds.countryPoints}
        type="geojson"
        data={geoJsonURL.countryPoints}
        generateId
        promoteId="id"
      >
        <Layer {...countryPointLayer({ visible: true })} />
      </Source>

      {filter?.country && (
        <Source
          id={SlacklineMapSourceIds.countriesOutlines}
          type="geojson"
          data={geoJsonURL.countryPolygons(filter.country)}
          generateId
          promoteId="id"
        >
          <Layer {...countryPolygonOutlineLayer()} />
        </Source>
      )}
    </>
  );
};
