import { Layer, Source, useMap } from "react-map-gl/mapbox";

import { SpotLayerIds } from "../layers/spotLayers";

export const TopoLayers = () => {
  const { current: map } = useMap();
  // Added on tilt, after SlackMap's own layers: under the base style's labels, or else under our lowest layer.
  const beforeId =
    map?.getStyle()?.layers?.find((l) => l.type === "symbol")?.id ??
    SpotLayerIds.spotPolygon;
  return (
    <>
      <Source
        id="mapbox-dem-hillshade"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      >
        <Layer
          id="topo-hillshade"
          beforeId={beforeId}
          type="hillshade"
          paint={{
            "hillshade-exaggeration": 0.5,
            "hillshade-shadow-color": "#2b2b2b",
          }}
        />
      </Source>
      <Source
        id="mapbox-terrain-v2"
        type="vector"
        url="mapbox://mapbox.mapbox-terrain-v2"
      >
        <Layer
          id="topo-contours"
          beforeId={beforeId}
          type="line"
          source-layer="contour"
          paint={{
            "line-color": "#ffffff",
            "line-opacity": ["case", ["==", ["get", "index"], 5], 0.7, 0.35],
            "line-width": ["case", ["==", ["get", "index"], 5], 1.2, 0.6],
          }}
        />
        <Layer
          id="topo-contour-labels"
          beforeId={beforeId}
          type="symbol"
          source-layer="contour"
          filter={["==", ["get", "index"], 5]}
          layout={{
            "symbol-placement": "line",
            "text-field": ["concat", ["to-string", ["get", "ele"]], " m"],
            "text-size": 10,
          }}
          paint={{
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 1,
          }}
        />
      </Source>
    </>
  );
};
