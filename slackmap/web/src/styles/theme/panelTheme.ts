import { createTheme } from '@mui/material';

import { appColors } from './colors';
import { theme } from './index';

// The side panel and the controls floating on the map are dark and flat, so the map stays the
// brightest thing on screen; the detail cards keep the light theme.
export const panelSurface = '#0E1A26';

export const glass = {
  background: 'rgba(14, 26, 38, 0.72)',
  hover: 'rgba(14, 26, 38, 0.88)',
  text: 'rgba(255, 255, 255, 0.92)',
  muted: 'rgba(255, 255, 255, 0.6)',
  blur: 'blur(10px)',
};

export const panelTheme = createTheme(theme, {
  palette: {
    mode: 'dark',
    background: { default: panelSurface, paper: panelSurface },
    text: { primary: 'rgba(255, 255, 255, 0.92)', secondary: 'rgba(255, 255, 255, 0.56)' },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: { hover: 'rgba(255, 255, 255, 0.06)', selected: 'rgba(255, 255, 255, 0.1)' },
    primary: { main: appColors.slackmapBlue },
  },
  components: {
    // Dark mode lightens raised surfaces; the sheet stays the panel's navy.
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', boxShadow: 'none', borderRadius: 999 } },
    },
  },
});

export const mapControlsSx = {
  '& .mapboxgl-ctrl-group, & div.mapboxgl-ctrl-geocoder': {
    backgroundColor: glass.background,
    backdropFilter: glass.blur,
    boxShadow: 'none',
  },
  '& .mapboxgl-ctrl-group': { borderRadius: '10px' },
  '& .mapboxgl-ctrl-group button + button': { borderTopColor: 'rgba(255, 255, 255, 0.12)' },
  '& .mapboxgl-ctrl-group .mapboxgl-ctrl-icon': { filter: 'invert(1)', opacity: 0.85 },
  '& .mapboxgl-ctrl-group button:not(:disabled):hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  '& div.mapboxgl-ctrl-geocoder': { borderRadius: '999px' },
  '& input.mapboxgl-ctrl-geocoder--input': { color: glass.text },
  '& input.mapboxgl-ctrl-geocoder--input::placeholder': { color: glass.muted },
  '& .mapboxgl-ctrl-geocoder--icon': { fill: glass.muted },
};
