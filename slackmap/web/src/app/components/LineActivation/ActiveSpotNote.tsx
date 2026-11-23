import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Link, Typography } from '@mui/material';

import { booleanPointInPolygon, distance } from '@turf/turf';
import { getActivePoints, useMapDataVersion } from 'app/api/geojson-data';
import { spotApi } from 'app/api/spot-api';
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson';
import { ui } from 'styles/theme/ui';

import { formatUntil } from './activationTimes';

type ActiveSpot = Awaited<ReturnType<typeof getActivePoints>>[number];

export const ActiveSpotNote = (props: { lineGeoJson: FeatureCollection }) => {
  const anchors = anchorsOf(props.lineGeoJson);
  const [nearby, setNearby] = useState<ActiveSpot[]>([]);

  const dataVersion = useMapDataVersion('features');

  useEffect(() => {
    setNearby([]);
    if (!anchors.length) return;
    let current = true;
    getActivePoints()
      .then((active) => {
        if (!current) return;
        setNearby(
          active.filter(
            (f) =>
              f.type === 'spot' &&
              Math.min(...anchors.map((a) => distance(a, f.center, { units: 'kilometers' }))) < nearbyKm,
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [JSON.stringify(anchors), dataVersion]);

  return (
    <>
      {nearby.map((spot) => (
        <SpotContaining key={spot.id} spot={spot} anchors={anchors} />
      ))}
    </>
  );
};

// A spot's centre is this close when the line can be inside it: spots are at most a few kilometres across.
const nearbyKm = 5;

const anchorsOf = (geoJson: FeatureCollection) => {
  const line = geoJson.features.find((f) => f.geometry?.type === 'LineString') as Feature<LineString> | undefined;
  const coordinates = line?.geometry.coordinates ?? [];
  return coordinates.length ? [coordinates[0], coordinates[coordinates.length - 1]] : [];
};

const SpotContaining = (props: { spot: ActiveSpot; anchors: number[][] }) => {
  const navigate = useNavigate();
  const { data } = spotApi.useGetSpotDetailsQuery(props.spot.id);
  const polygons = (data?.geoJson.features ?? []).filter((f) => f.geometry?.type === 'Polygon') as Feature<Polygon>[];
  const inside = polygons.some((p) => props.anchors.some((a) => booleanPointInPolygon(a, p)));
  if (!inside) return null;
  return (
    <Typography variant="body2" sx={{ color: ui.liveInk, bgcolor: ui.liveTint, borderRadius: '12px', px: 1.5, py: 1 }}>
      In an active spot,{' '}
      <Link component="button" variant="body2" onClick={() => navigate(`/spot/${props.spot.id}`)} sx={{ fontWeight: 600 }}>
        {data?.name || 'this spot'}
      </Link>
      , until {formatUntil(props.spot.activeUntil)}.
    </Typography>
  );
};
