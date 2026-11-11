/* eslint-disable no-unused-vars */
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    body2Bold: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body2Bold?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body2Bold: true;
  }
}
