import { PaletteOptions } from '@mui/material';

import { brand } from './brand';
import { appColors } from './colors';

export const palette: PaletteOptions = {
  mode: 'light',
  text: {
    primary: brand('isa-color-text-default'),
    secondary: brand('isa-color-text-muted'),
  },
  primary: {
    main: appColors.slackmapBlue,
  },
  secondary: {
    main: appColors.slackmapGreen,
  },
  error: {
    main: brand('isa-color-action-danger-bg'),
  },
};
