import { Box, Link } from '@mui/material';

export const MapTermsNote = () => (
  <Box
    sx={{
      position: 'absolute',
      zIndex: 1,
      bottom: 4,
      left: 4,
      paddingX: 0.75,
      borderRadius: 1,
      fontSize: '0.625rem',
      color: 'rgba(0,0,0,0.75)',
      backgroundColor: 'rgba(255,255,255,0.7)',
    }}
  >
    © ISA ·{' '}
    <Link href="/terms" color="inherit">
      Data use terms
    </Link>{' '}
    · no automated access
  </Box>
);
