import { appColors } from 'styles/theme/colors';

import { CircleLayer, LineLayer, SymbolLayer, genericSymbolLayer } from './common';

type CommonOpts = {
  visible?: boolean;
  filter?: any[];
};

export const CountryLayerIds = {
  countryPoint: 'countryPoint',
  countryDot: 'countryDot',
  countryPolygonOutline: 'countryPolygonOutline',
} as const;

// Zoomed out, a country is hidden, then only a dot, so the countries do not cover the map; the flag fades in over it.
// A fade, not a growing size: Mapbox sizes symbols per whole zoom level, so a steep size curve jumps
// while the next level's tiles load.
const dotUntilZoom = 2;
const flagFromZoom = 5;

export const countryPointLayer = (opts: CommonOpts & { fromDot?: boolean }): SymbolLayer => {
  const symbolLayer = genericSymbolLayer(opts);
  const fadeIn = (opacity: any) =>
    opts.fromDot ? ['interpolate', ['linear'], ['zoom'], dotUntilZoom, 0, flagFromZoom, opacity] : opacity;

  return {
    ...symbolLayer,
    id: CountryLayerIds.countryPoint,
    ...(opts.fromDot && { minzoom: dotUntilZoom }),
    paint: {
      ...symbolLayer.paint,
      'icon-opacity': fadeIn(symbolLayer.paint?.['icon-opacity']),
      'text-opacity': fadeIn(1),
    },
    layout: {
      ...symbolLayer.layout,
      'icon-image': 'slackmap-country-symbol',
      'symbol-placement': 'point',
      'icon-allow-overlap': false,
      'text-field': '{id}',
      'text-size': ['interpolate', ['exponential', 1], ['zoom'], 0, 7, 7, 12, 13, 16],
      'text-offset': [
        'interpolate',
        ['exponential', 1],
        ['zoom'],
        0,
        ['literal', [0, -1.3]],
        7,
        ['literal', [0, -2]],
        13,
        ['literal', [0, -2.5]],
      ],
      'icon-size': ['interpolate', ['exponential', 1], ['zoom'], 1, 0.5, 4, 0.65, 8, 0.8, 13, 0.4],
    },
  };
};

export const countryDotLayer = (): CircleLayer => ({
  id: CountryLayerIds.countryDot,
  type: 'circle',
  minzoom: dotUntilZoom,
  maxzoom: flagFromZoom,
  paint: {
    'circle-radius': 3,
    // The flag icon's color.
    'circle-color': '#1DDECE',
    'circle-opacity': ['interpolate', ['linear'], ['zoom'], dotUntilZoom, 1, flagFromZoom, 0],
  },
});

export const countryPolygonOutlineLayer = (): LineLayer => {
  return {
    id: CountryLayerIds.countryPolygonOutline,
    type: 'line',
    filter: [
      'any',
      ['==', ['geometry-type'], 'Polygon'],
      ['==', ['geometry-type'], 'MultiPolygon'],
    ],
    paint: {
      'line-width': 2,
      'line-opacity': 1,
      'line-color': appColors.countryColor,
      'line-dasharray': [1, 1],
    },
  };
};
