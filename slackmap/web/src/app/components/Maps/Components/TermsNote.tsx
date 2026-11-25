import { Box, Link } from '@mui/material';
import { safeArea } from 'styles/theme/ui';

export const MapTermsNote = (props: { satellite?: boolean }) => (
  <Box
    sx={{
      position: 'absolute',
      zIndex: 1,
      bottom: { xs: `calc(60px + ${safeArea.bottom})`, lg: 6 },
      left: 'calc(var(--panel-inset, 0px) + 6px)',
      paddingX: 0.75,
      borderRadius: 999,
      fontSize: 11,
      color: 'text.primary',
      backgroundColor: 'rgba(255,255,255,0.75)',
    }}
  >
    © ISA ·{' '}
    <Link href="https://www.mapbox.com/about/maps" target="_blank" color="inherit">
      © Mapbox
    </Link>{' '}
    ·{' '}
    <Link href="https://www.openstreetmap.org/copyright" target="_blank" color="inherit">
      © OpenStreetMap
    </Link>{' '}
    {props.satellite && <>· © Maxar </>}
    ·{' '}
    <Link href="https://www.mapbox.com/map-feedback" target="_blank" color="inherit">
      Improve this map
    </Link>{' '}
    ·{' '}
    <Link href="/terms" color="inherit">
      Terms
    </Link>
  </Box>
);
