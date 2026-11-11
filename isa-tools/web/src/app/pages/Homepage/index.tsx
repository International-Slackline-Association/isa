import { Link } from 'react-router-dom';

import BuildIcon from '@mui/icons-material/Build';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import RedeemIcon from '@mui/icons-material/Redeem';
import WarningIcon from '@mui/icons-material/Warning';
import { Button, Typography, buttonClasses } from '@mui/material';
import { Stack } from '@mui/system';
import Grid from '@mui/system/Unstable_Grid';

export const homepageItems = [
  {
    icon: <CardMembershipIcon />,
    title: 'Certified Instructors',
    subtitle: 'List of ISA Certified instructors',
    route: '/certified-instructors',
  },
  {
    icon: <RedeemIcon />,
    title: 'Certified Riggers',
    subtitle: 'List of ISA Certified riggers',
    route: '/certified-riggers',
  },
  {
    icon: <BuildIcon />,
    title: 'Certified Gears',
    subtitle: 'List of ISA Certified gears',
    route: '/certified-gears',
  },
  {
    icon: <WarningIcon />,
    title: 'Equipment Warnings',
    subtitle: 'Warnings and recalls for slackline equipment',
    route: '/equipment-warnings',
  },
  {
    icon: <WarningIcon />,
    title: 'Sair Reports',
    subtitle: 'Accident Reports',
    route: '/sair-reports',
  },
  {
    icon: <EmojiEventsIcon />,
    title: 'World Records',
    subtitle: 'ISA recognized world records',
    route: '/world-records',
  },
  {
    icon: <EmojiEventsIcon />,
    title: 'World Firsts',
    subtitle: 'ISA recognized world firsts',
    route: '/world-firsts',
  },
  {
    icon: <QrCode2Icon />,
    title: 'Verify',
    subtitle: 'Verify your QR code issued by the ISA',
    route: '/verify',
    hide: true,
  },
];

export function Homepage() {
  const sx = {
    [`& .${buttonClasses.startIcon} > *:nth-of-type(1)`]: {
      fontSize: '30px',
      mr: 2,
    },
    textTransform: 'none',
    width: '100%',
    justifyContent: 'flex-start',
  };

  return (
    <Grid container spacing={4}>
      {homepageItems.map((item) => (
        <Grid xs={12} lg={4} key={item.route}>
          {!item.hide && (
            <Button
              component={Link}
              to={item.route}
              variant="contained"
              sx={sx}
              startIcon={item.icon}
            >
              <Stack direction="column" spacing={0} sx={{ textAlign: 'left' }}>
                <Typography variant="body2Bold">{item.title}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.66rem' }}>
                  {item.subtitle}
                </Typography>
              </Stack>
            </Button>
          )}
        </Grid>
      ))}
    </Grid>
  );
}
