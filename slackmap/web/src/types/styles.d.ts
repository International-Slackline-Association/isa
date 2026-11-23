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
    active: Palette['primary'];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
    active?: PaletteOptions['primary'];
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
    active: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    active: true;
  }
}
