
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import PentagonIcon from '@mui/icons-material/Pentagon';
import { Avatar, Box, Stack, Typography } from '@mui/material';

import { SlacklineFeatureIcon } from 'app/components/Icons/SlacklineFeatureIcon';
import { appColors } from 'styles/theme/colors';
import { useAppLocalStorage } from 'utils/hooks/useAppLocalStorage';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

import { TutorialDialog } from './TutorialDialog';

const Item = (props: { color: string; label: string }) => {
  const { isDesktop } = useMediaQuery();
  return (
    <Stack spacing={0.5} direction={'row'} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: isDesktop ? '10px' : '5px',
          height: isDesktop ? '10px' : '5px',
          bgcolor: props.color,
          borderRadius: '50%',
        }}
      />
      <Typography variant={'caption'} sx={{ fontSize: isDesktop ? 'auto' : '0.6rem' }}>
        {props.label}
      </Typography>
    </Stack>
  );
};

const TutorialPage = (props: { img: string; title: string; children: React.ReactNode }) => {
  return (
    <Stack
      spacing={4}
      sx={{
        height: { xs: '66vh', lg: '75vh' },
        overflowY: 'scroll',
      }}
    >
      <img
        src={props.img}
        style={{
          maxWidth: '100%',
          objectFit: 'contain',
        }}
        alt={''}
      />
      <Stack spacing={2} sx={{ px: 4, alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {props.title}
        </Typography>
        {props.children}
      </Stack>
    </Stack>
  );
};

export const welcomeTutorialPages = [
  <TutorialPage
    key={'tutorial-0'}
    img={'/images/tutorials/map-features.png'}
    title={'Try the Interactable Map'}
  >
    <Stack spacing={1} direction={'row'} sx={{ alignItems: 'center' }}>
      <Item color={appColors.lineStrokeColor} label={'Slacklines'} />
      <Item color={appColors.spotFillColor} label={'Spots'} />
      <Item color={appColors.guideFeaturesColor} label={'Access Guides'} />
      <Item color={appColors.countryColor} label={'Countries'} />
    </Stack>
    <Typography variant="subtitle2">
      You can click on any of these features to see more information about them. <br />
    </Typography>
    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
      Hint: Click on the country flags to filter the features and see the activities within the
      country.
    </Typography>
  </TutorialPage>,
  <TutorialPage
    key={'tutorial-1'}
    img={'/images/tutorials/feature-types.png'}
    title={'Add Your Features'}
  >
    <Stack spacing={2} direction={'row'} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ bgcolor: appColors.lineStrokeColor }}>
        <SlacklineFeatureIcon />
      </Avatar>
      <Avatar sx={{ bgcolor: appColors.spotFillColor }}>
        <PentagonIcon />
      </Avatar>
      <Avatar sx={{ bgcolor: appColors.guideFeaturesColor }}>
        <FollowTheSignsIcon />
      </Avatar>
    </Stack>
    <Typography variant="subtitle2">
      <b>- Lines</b> are the slacklines on the map. <br /> <br />
      <b>- Spots</b> are the areas that are slacklining zones. <br /> <br />
      <b>- Access Guides</b> are the visual helpers, like access trails, camping spot, parking lots,
      etc.
    </Typography>
  </TutorialPage>,
  <TutorialPage
    key={'tutorial-2'}
    img={'/images/tutorials/map-settings.png'}
    title={'Change Settings'}
  >
    <Typography variant="subtitle2">
      You can change the map style, show/hide features, and filter the slacklines by their types
      from the map settings.
    </Typography>
  </TutorialPage>,
];

export const WelcomeTutorial = () => {
  const isWelcomeSeen = useAppLocalStorage('tutorial.welcomeSeen', false);

  if (isWelcomeSeen.value) return null;

  return <TutorialDialog pages={welcomeTutorialPages} onClose={() => isWelcomeSeen.set(true)} />;
};
