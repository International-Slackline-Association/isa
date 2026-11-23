import { PaletteOptions } from '@mui/material';

import { appColors } from './colors';
import { ui } from './ui';

export const palette: PaletteOptions = {
  mode: 'light',
  text: {
    primary: ui.text,
    secondary: ui.muted,
  },
  primary: {
    main: ui.blue,
    dark: ui.blueDark,
    light: ui.blueTint,
    contrastText: '#fff',
  },
  secondary: {
    main: appColors.slackmapGreen,
  },
  neutral: {
    main: ui.fill,
    dark: ui.fillHover,
    contrastText: ui.text,
  },
  live: {
    main: ui.live,
    dark: '#C62C78',
    light: ui.liveTint,
    contrastText: ui.onLive,
  },
  error: {
    main: ui.danger,
    light: ui.dangerTint,
  },
  divider: ui.line,
  background: {
    default: ui.fill,
    paper: '#fff',
  },
};
