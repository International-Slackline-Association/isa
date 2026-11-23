import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    body2Bold: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    body2Bold?: React.CSSProperties;
  }

  interface Palette {
    neutral: Palette['primary'];
    live: Palette['primary'];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
    live?: PaletteOptions['primary'];
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body2Bold: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
    live: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    live: true;
  }
}
