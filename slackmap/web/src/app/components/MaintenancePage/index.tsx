import { Box, Link, Typography, keyframes } from '@mui/material';

import { appColors } from 'styles/theme/colors';
import { ui } from 'styles/theme/ui';

const pulse = keyframes`
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
`;

export const MaintenancePage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 4,
        bgcolor: ui.fill,
      }}
    >
      <Box
        component="img"
        src="/images/slackmapLogoWithText.png"
        alt="SlackMap"
        sx={{ width: 260, maxWidth: '80%', mb: 5 }}
      />

      <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
        We&rsquo;ll be back soon
      </Typography>

      <Box
        sx={{
          width: 56,
          height: 4,
          borderRadius: 2,
          backgroundColor: appColors.slackmapGreen,
          mb: 4,
        }}
      />

      <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: 'text.secondary', maxWidth: 440, mb: 4 }}>
        SlackMap is temporarily offline for a technical reason. We plan to come back online soon.
        Thank you.
      </Typography>

      <Box sx={{ display: 'inline-flex', gap: '6px', mb: 4 }}>
        {[0, 0.2, 0.4].map((delay) => (
          <Box
            key={delay}
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: ui.blue,
              animation: `${pulse} 1.2s infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </Box>

      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        Questions?{' '}
        <Link
          href="mailto:slackmap@slacklineinternational.org"
          sx={{ fontWeight: 600 }}
        >
          slackmap@slacklineinternational.org
        </Link>
      </Typography>
    </Box>
  );
};
