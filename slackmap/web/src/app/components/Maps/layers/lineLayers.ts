import { appColors } from 'styles/theme/colors';

import {
  CircleLayer,
  LineLayer,
  SymbolLayer,
  genericCircleLayer,
  genericLabelLayer,
  genericLineLayer,
} from './common';

type CommonOpts = {
  visible?: boolean;
  filter?: any[];
};

export const LineLayerIds = {
  linePoint: 'linePoint',
  lineLine: 'lineLine',
  lineLabel: 'lineLabel',
  lineRiggedHalo: 'lineRiggedHalo',
  linePointRiggedHalo: 'linePointRiggedHalo',
} as const;

export const linePointLayer = (opts: CommonOpts): CircleLayer => {
  const circleLayer = genericCircleLayer(opts);
  return {
    ...circleLayer,
    id: LineLayerIds.linePoint,
    maxzoom: 13,
    paint: {
      ...circleLayer.paint,
      'circle-color': appColors.lineStrokeColor,
    },
  };
};
export const lineLineStringLayer = (opts: CommonOpts): LineLayer => {
  const lineLayer = genericLineLayer(opts);
  return {
    ...lineLayer,
    id: LineLayerIds.lineLine,
    paint: {
      ...lineLayer.paint,
      'line-color': appColors.lineStrokeColor,
    },
  };
};

export const lineLabelLayer = (opts: CommonOpts): SymbolLayer => {
  const labelLayer = genericLabelLayer(opts);

  return {
    ...labelLayer,
    id: LineLayerIds.lineLabel,
    paint: {
      ...labelLayer.paint,
      'icon-color': appColors.lineStrokeColor,
    },
  };
};

// Rigged now: an orange glow under the line, and under its point when zoomed out.
const rigColor = appColors.riggedColor;

export const riggedLineHaloLayer = (opts: CommonOpts): LineLayer => ({
  id: LineLayerIds.lineRiggedHalo,
  type: 'line',
  minzoom: 12,
  filter: opts.filter,
  layout: { 'line-cap': 'round', visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'line-color': rigColor, 'line-width': 14, 'line-opacity': 0.45, 'line-blur': 4 },
});

export const riggedPointHaloLayer = (opts: CommonOpts): CircleLayer => ({
  id: LineLayerIds.linePointRiggedHalo,
  type: 'circle',
  maxzoom: 13,
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'circle-color': rigColor, 'circle-radius': 14, 'circle-opacity': 0.45, 'circle-blur': 0.6 },
});
