import React from 'react';

import { Box } from '@mui/material';

import { mapControlsSx } from 'styles/theme/panelTheme';
import { radius, safeArea, shadow } from 'styles/theme/ui';

// The frame of every create and edit page: the drawing map full size, the form floating over its right
// side on desktop and over its lower half on phones.
export const FeatureFormLayout = (props: { map: React.ReactNode; form: React.ReactNode }) => (
  <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden', '--card-inset': { xs: '0px', lg: 'max(30vw, 352px)' } }}>
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        ...mapControlsSx,
        '& .mapboxgl-ctrl-top-left': { marginLeft: 'var(--panel-inset, 0px)' },
        '& .mapboxgl-ctrl-top-right': { marginRight: 'var(--card-inset, 0px)' },
        // The drawing tools sit bottom right: beside the form on desktop, above it on phones.
        '& .mapboxgl-ctrl-bottom-right': { marginRight: 'var(--card-inset, 0px)', bottom: { xs: '58%', lg: 0 } },
      }}
    >
      {props.map}
    </Box>
    <Box
      sx={{
        position: 'absolute',
        zIndex: 4,
        overflow: 'hidden',
        boxShadow: shadow.float,
        top: { xs: '42%', lg: 12 },
        bottom: { xs: 0, lg: 12 },
        right: { xs: 0, lg: 12 },
        left: { xs: 0, lg: 'auto' },
        width: { lg: 'calc(var(--card-inset) - 12px)' },
        borderRadius: { xs: '18px 18px 0 0', lg: `${radius.card}px` },
        pb: { xs: safeArea.bottom, lg: 0 },
        bgcolor: 'background.paper',
      }}
    >
      {props.form}
    </Box>
  </Box>
);
