import { Theme, createTheme, responsiveFontSizes } from '@mui/material';

import { brand } from './brand';
import { palette } from './palette';

export const theme: Theme = responsiveFontSizes(
  createTheme({
    palette: palette,
    components: {
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            body2Bold: 'p',
          },
        },
      },
    },
    typography: {
      fontFamily: brand('isa-font-family-body'),
      ...Object.fromEntries(
        (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((variant) => [
          variant,
          { fontFamily: brand('isa-font-family-heading') },
        ]),
      ),
      body2Bold: {
        fontWeight: 'bold',
        letterSpacing: -0.08,
      },
      body1: {
        letterSpacing: 0.04,
      },
      body2: {
        letterSpacing: 0.04,
      },
    },
  }),
);
