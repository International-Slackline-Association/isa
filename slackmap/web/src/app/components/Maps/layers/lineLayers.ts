import { useEffect } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { appColors } from 'styles/theme/colors';

import { SpotLayerIds } from './spotLayers';

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
  lineLineElevated: 'lineLineElevated',
  lineLabel: 'lineLabel',
  lineActiveHalo: 'lineActiveHalo',
  linePointActiveHalo: 'linePointActiveHalo',
  linePointActive: 'linePointActive',
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
// With the line drawn in the air, the ground line stays faint as its shadow.
export const lineLineStringLayer = (opts: CommonOpts & { shadow?: boolean }): LineLayer => {
  const lineLayer = genericLineLayer(opts);
  const opacity = lineLayer.paint!['line-opacity'] as any[];
  return {
    ...lineLayer,
    id: LineLayerIds.lineLine,
    paint: {
      ...lineLayer.paint,
      'line-color': appColors.lineStrokeColor,
      ...(opts.shadow ? { 'line-opacity': [...opacity.slice(0, -2), 0.5, 0.3] as any } : {}),
    },
  };
};

// Straight between the anchors' heights above sea, which its features carry as `ea` and `eb`.
export const lineLineElevatedLayer = (opts: CommonOpts): LineLayer => {
  const lineLayer = genericLineLayer(opts);
  return {
    ...lineLayer,
    id: LineLayerIds.lineLineElevated,
    layout: {
      ...lineLayer.layout,
      'line-elevation-reference': 'sea',
      'line-z-offset': ['interpolate', ['linear'], ['line-progress'], 0, ['get', 'ea'], 1, ['get', 'eb']],
    },
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

const activeColor = appColors.activeColor;

export const activeLineHaloLayer = (opts: CommonOpts): LineLayer => ({
  id: LineLayerIds.lineActiveHalo,
  type: 'line',
  minzoom: 12,
  filter: opts.filter,
  layout: { 'line-cap': 'round', visibility: opts.visible ? 'visible' : 'none' },
  paint: { 'line-color': activeColor, 'line-width': 12, 'line-opacity': 0.6, 'line-blur': 1 },
});

export const activePointHaloLayer = (opts: CommonOpts): CircleLayer => ({
  id: LineLayerIds.linePointActiveHalo,
  type: 'circle',
  maxzoom: 13,
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  // Radius and opacity are animated into a pulse while the map shows it.
  paint: { 'circle-color': activeColor, 'circle-radius': 12, 'circle-opacity': 0.35 },
});

// Drawn over the line's plain point.
export const activePointLayer = (opts: CommonOpts): CircleLayer => ({
  id: LineLayerIds.linePointActive,
  type: 'circle',
  maxzoom: 13,
  filter: opts.filter,
  layout: { visibility: opts.visible ? 'visible' : 'none' },
  paint: {
    'circle-color': activeColor,
    'circle-radius': 6,
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
});

export const useActivePointPulse = (map: MapboxMap | undefined) => {
  useEffect(() => {
    if (!map) return;
    let frame = 0;
    const halos = [LineLayerIds.linePointActiveHalo, SpotLayerIds.spotPointActiveHalo];
    const markers = [LineLayerIds.linePointActive, SpotLayerIds.spotPointActive];
    const tick = (time: number) => {
      const t = (time % 1600) / 1600;
      // Mid style change a halo layer is gone, and a paint change on it throws.
      for (const halo of halos.filter((id) => map.getLayer(id))) {
        map.setPaintProperty(halo, 'circle-radius', 8 + t * 18);
        map.setPaintProperty(halo, 'circle-opacity', 0.45 * (1 - t));
      }
      frame = requestAnimationFrame(tick);
    };
    // Every paint change redraws the map and keeps it from going idle, so the pulse runs only while
    // an active marker is on screen; the rest of the time the map rests.
    const check = () => {
      const present = markers.filter((id) => map.getLayer(id));
      const onScreen =
        map.isStyleLoaded() && present.length > 0 && map.queryRenderedFeatures({ layers: present }).length > 0;
      if (onScreen && !frame) frame = requestAnimationFrame(tick);
      if (!onScreen && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const timer = setInterval(check, 1000);
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [map]);
};
