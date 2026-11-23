import { createTheme } from '@mui/material';

import { theme } from './index';
import { radius, shadow, ui } from './ui';

export const panelTheme = createTheme(theme, {
  palette: {
    primary: { main: '#fff', dark: ui.blueTint, contrastText: ui.blueDark },
    text: { primary: ui.onBlue, secondary: ui.onBlueMuted },
    background: { default: ui.blue, paper: ui.blue },
    divider: ui.onBlueFill,
    action: { hover: ui.onBlueFill, selected: ui.onBlueFillHover, active: ui.onBlue },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'outlined' },
          style: { backgroundColor: ui.onBlueFill, color: ui.onBlue, '&:hover': { backgroundColor: ui.onBlueFillHover } },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: { root: { color: ui.onBlue, '&:hover': { backgroundColor: ui.onBlueFill } } },
    },
    MuiLink: {
      styleOverrides: { root: { color: ui.onBlueMuted, '&:hover': { color: ui.onBlue } } },
    },
    MuiAvatar: {
      styleOverrides: { colorDefault: { backgroundColor: ui.onBlueFill, color: ui.onBlue } },
    },
    MuiPaper: {
      styleOverrides: { root: { color: ui.onBlue } },
    },
  },
});

export const mapControlsSx = {
  '& .mapboxgl-ctrl-group, & div.mapboxgl-ctrl-geocoder': {
    backgroundColor: '#fff',
    boxShadow: shadow.float,
  },
  '& .mapboxgl-ctrl-group': { borderRadius: '12px', overflow: 'hidden' },
  '& .mapboxgl-ctrl-group button': { width: 34, height: 34 },
  '& .mapboxgl-ctrl-group button + button': { borderTopColor: ui.line },
  '& div.mapboxgl-ctrl-geocoder': { borderRadius: `${radius.pill}px`, fontFamily: theme.typography.fontFamily },
  '& input.mapboxgl-ctrl-geocoder--input': { color: ui.text, height: 38, fontSize: 14 },
  '& .mapboxgl-ctrl-geocoder--icon': { fill: ui.muted },
  '& .mapboxgl-ctrl-geocoder .suggestions': { borderRadius: '14px', boxShadow: shadow.float },
};
