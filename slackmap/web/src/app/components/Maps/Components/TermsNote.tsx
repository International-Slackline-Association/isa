import { Box, Link } from '@mui/material';

export const MapTermsNote = () => (
  <Box
    sx={{
      position: 'absolute',
      zIndex: 1,
      bottom: { xs: 60, lg: 6 },
      left: 'calc(var(--panel-inset, 0px) + 6px)',
      paddingX: 0.75,
      borderRadius: 999,
      fontSize: 11,
      color: 'text.primary',
      backgroundColor: 'rgba(255,255,255,0.75)',
    }}
  >
    © ISA ·{' '}
    <Link href="/terms" color="inherit">
      Terms
    </Link>
  </Box>
);
