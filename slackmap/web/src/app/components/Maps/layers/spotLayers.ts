import { appColors } from 'styles/theme/colors';

import {
  CircleLayer,
  FillLayer,
  LineLayer,
  genericCircleLayer,
  genericFillLayer,
  genericLineLayer,
} from './common';

type CommonOpts = {
  visible?: boolean;
  filter?: any[];
};

export const SpotLayerIds = {
  spotPoint: 'spotPoint',
  spotPolygon: 'spotPolygon',
  spotOutline: 'spotOutline',
  spotActiveFill: 'spotActiveFill',
  spotActiveOutline: 'spotActiveOutline',
  spotPointActiveHalo: 'spotPointActiveHalo',
  spotPointActive: 'spotPointActive',
} as const;

export const spotPointLayer = (opts: CommonOpts): CircleLayer => {
  const circleLayer = genericCircleLayer(opts);
  return {
    ...circleLayer,
    id: SpotLayerIds.spotPoint,
    maxzoom: 13,
    paint: {
      ...circleLayer.paint,
      'circle-color': appColors.spotFillColor,
    },
  };
};
export const spotPolygonLayer = (opts: CommonOpts): FillLayer => {
  const fillLayer = genericFillLayer(opts);
  return {
    ...fillLayer,
    id: SpotLayerIds.spotPolygon,
    paint: {
      ...fillLayer.paint,
      'fill-color': appColors.spotFillColor,
    },
  };
};

export const spotPolygonOutlineLayer = (opts: CommonOpts): LineLayer => {
  const lineLayer = genericLineLayer(opts);

  return {
    ...lineLayer,
    id: SpotLayerIds.spotOutline,
    filter: ['all', ['==', ['geometry-type'], 'Polygon'], opts.filter ?? true],
    paint: {
      ...lineLayer.paint,
      'line-width': 2,
      'line-opacity': 1,
      'line-color': appColors.spotFillColor,
    },
  };
};

export const activeSpotFillLayer = (opts: CommonOpts): FillLayer => ({
  id: SpotLayerIds.spotActiveFill,
  type: 'fill',
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'fill-color': appColors.activeColor, 'fill-opacity': 0.3 },
});

export const activeSpotOutlineLayer = (opts: CommonOpts): LineLayer => ({
  id: SpotLayerIds.spotActiveOutline,
  type: 'line',
  filter: ['all', ['==', ['geometry-type'], 'Polygon'], opts.filter ?? true],
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'line-color': appColors.activeColor, 'line-width': 3 },
});

export const activeSpotPointHaloLayer = (opts: CommonOpts): CircleLayer => ({
  id: SpotLayerIds.spotPointActiveHalo,
  type: 'circle',
  maxzoom: 13,
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'circle-color': appColors.activeColor, 'circle-radius': 12, 'circle-opacity': 0.35 },
});

export const activeSpotPointLayer = (opts: CommonOpts): CircleLayer => ({
  id: SpotLayerIds.spotPointActive,
  type: 'circle',
  maxzoom: 13,
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: {
    'circle-color': appColors.activeColor,
    'circle-radius': 6,
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
});
