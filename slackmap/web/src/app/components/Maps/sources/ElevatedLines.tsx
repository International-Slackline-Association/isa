import { useEffect, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';

import type { Feature, FeatureCollection, LineString } from 'geojson';

import { LineLayerIds, lineLineElevatedLayer } from '../layers/lineLayers';
import { SlacklineMapSourceIds } from './slacklineMapSources';

// The DEM is coarser than a cliff edge: the highest ground near an anchor keeps the line from diving into the rock.
const ANCHOR_SEARCH_RADIUS_M = 8;

const groundElevation = (map: MapboxMap, [lng, lat]: number[]) => {
  const dLat = ANCHOR_SEARCH_RADIUS_M / 111_320;
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  let max: number | undefined;
  for (const [x, y] of [
    [0, 0],
    ...Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]),
  ]) {
    const e = map.queryTerrainElevation([lng + x * dLng, lat + y * dLat], { exaggerated: false });
    if (e === null || e === undefined) return undefined;
    max = max === undefined ? e : Math.max(max, e);
  }
  return max;
};

// The geojson is tiled, so a line may come in pieces.
const anchorsOf = (pieces: number[][][]) => {
  const points = pieces.flat();
  let best: [number[], number[]] = [points[0], points[points.length - 1]];
  let bestDistance = -1;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = (points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2;
      if (d > bestDistance) {
        bestDistance = d;
        best = [points[i], points[j]];
      }
    }
  }
  return best;
};

const buildElevatedLines = (map: MapboxMap, linesSourceId: string): FeatureCollection => {
  const piecesById = new Map<string, { properties: any; pieces: number[][][] }>();
  for (const f of map.querySourceFeatures(linesSourceId)) {
    if (f.geometry.type !== 'LineString') continue;
    const id = String(f.properties?.id ?? f.id);
    const entry = piecesById.get(id) ?? { properties: f.properties, pieces: [] };
    entry.pieces.push(f.geometry.coordinates);
    piecesById.set(id, entry);
  }
  const features: Feature<LineString>[] = [];
  for (const { properties, pieces } of piecesById.values()) {
    const [a, b] = anchorsOf(pieces);
    const ea = groundElevation(map, a);
    const eb = groundElevation(map, b);
    if (ea === undefined || eb === undefined) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [a, b] },
      properties: { ...properties, ea, eb },
    });
  }
  return { type: 'FeatureCollection', features };
};

const empty: FeatureCollection = { type: 'FeatureCollection', features: [] };

export const ElevatedLines = (props: {
  enabled: boolean;
  linesSourceId: string;
  visible: boolean;
  filter?: any;
}) => {
  const { current: ref } = useMap();
  const [data, setData] = useState<FeatureCollection>(empty);
  const active = props.enabled && props.visible;

  useEffect(() => {
    const map = ref?.getMap();
    if (!map || !active) {
      setData(empty);
      return;
    }
    let last = '';
    // Idle is when the terrain under the view has loaded, so anchors can be measured.
    const update = () => {
      const layer = map.getLayer(LineLayerIds.lineLineElevated);
      if (layer?.minzoom !== undefined && map.getZoom() < layer.minzoom) return;
      const next = buildElevatedLines(map, props.linesSourceId);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setData(next);
      }
    };
    update();
    map.on('idle', update);
    return () => {
      map.off('idle', update);
    };
  }, [ref, active, props.linesSourceId]);

  return (
    <Source id={SlacklineMapSourceIds.linesElevated} type="geojson" data={data} lineMetrics promoteId="id">
      <Layer {...lineLineElevatedLayer({ visible: active, filter: props.filter })} />
    </Source>
  );
};
