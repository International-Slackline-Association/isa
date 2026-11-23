import { RefObject, useEffect, useState } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

import { Box, CircularProgress, Typography } from '@mui/material';

import { shadow } from 'styles/theme/ui';

import { useSessionReady } from 'app/session';

// Shown over the drawn map while the browser check runs and the map data downloads, so an empty
// map does not read as a map without data.
export const MapDataLoadingIndicator = (props: {
  mapRef: RefObject<MapRef | null>;
  isMapLoaded: boolean;
  sourceId: string;
}) => {
  const { mapRef, isMapLoaded, sourceId } = props;
  const sessionReady = useSessionReady();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!isMapLoaded || !sessionReady || dataLoaded || !map) return;
    const check = () => {
      if (map.getSource(sourceId) && map.isSourceLoaded(sourceId)) setDataLoaded(true);
    };
    map.on('sourcedata', check);
    map.on('idle', check);
    check();
    return () => {
      map.off('sourcedata', check);
      map.off('idle', check);
    };
  }, [mapRef, isMapLoaded, sessionReady, dataLoaded, sourceId]);

  if (!isMapLoaded || dataLoaded) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 3,
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          paddingX: 2,
          paddingY: 1,
          borderRadius: 999,
          backgroundColor: '#fff',
          boxShadow: shadow.float,
        }}
      >
        <CircularProgress size={18} thickness={5} />
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {sessionReady ? 'Loading map data…' : 'Checking your browser…'}
        </Typography>
      </Box>
    </Box>
  );
};
