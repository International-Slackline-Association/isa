import { ReactNode, useState } from 'react';
import { useSelector } from 'react-redux';

import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Button, Stack, ThemeProvider, Typography, useMediaQuery as useMuiMediaQuery } from '@mui/material';

import { PopupDialog } from 'app/components/Dialogs/PopupDialog';
import { isReturningFromSignIn } from 'app/signIn';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { theme } from 'styles/theme';
import { radius, shadow, ui } from 'styles/theme/ui';
import { useAppLocalStorage } from 'utils/hooks/useAppLocalStorage';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

import { ManualSteps, useInstallWay } from './install';

type Step = { text: string; icon: ReactNode };

const share: Step = { text: 'Tap Share', icon: <IosShareIcon /> };
const addToHomeScreen: Step = {
  text: 'Scroll down, tap Add to Home Screen',
  icon: <AddBoxOutlinedIcon />,
};

const stepsOf: Record<ManualSteps, Step[]> = {
  safari: [{ text: 'Tap Share in the toolbar', icon: <IosShareIcon /> }, addToHomeScreen],
  safariMenu: [{ text: 'Tap ••• next to the address bar', icon: <MoreHorizIcon /> }, share, addToHomeScreen],
  chromeIos: [{ text: 'Tap Share in the address bar', icon: <IosShareIcon /> }, addToHomeScreen],
  edgeIos: [{ text: 'Tap ••• at the bottom', icon: <MoreHorizIcon /> }, share, addToHomeScreen],
  firefoxIos: [{ text: 'Tap the menu ☰', icon: <MenuIcon /> }, share, addToHomeScreen],
  firefoxAndroid: [
    { text: 'Tap the menu ⋮', icon: <MoreVertIcon /> },
    { text: 'Tap Add app to Home screen', icon: <AddBoxOutlinedIcon /> },
  ],
};

const StepsDialog = (props: { steps: ManualSteps; open: boolean; onClose: () => void }) => (
  <PopupDialog
    open={props.open}
    onClose={props.onClose}
    title="Install SlackMap"
    description="Your browser adds it to the home screen from its menu."
    actions={
      <Button variant="contained" onClick={props.onClose}>
        Got it
      </Button>
    }
  >
    <Stack component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {stepsOf[props.steps].map((step, i) => (
        <Stack
          key={step.text}
          component="li"
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: 'center',
            py: 1,
            borderTop: i ? `1px solid ${ui.line}` : undefined,
          }}
        >
          <Box
            sx={{
              flex: 'none',
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: ui.fill,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            {i + 1}
          </Box>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {step.text}
          </Typography>
          <Box
            sx={{
              flex: 'none',
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 28,
              borderRadius: '8px',
              bgcolor: ui.fill,
              color: ui.text,
              '& .MuiSvgIcon-root': { fontSize: 18 },
            }}
          >
            {step.icon}
          </Box>
        </Stack>
      ))}
    </Stack>
  </PopupDialog>
);

const useInstall = () => {
  const way = useInstallWay();
  const { isDesktop } = useMediaQuery();
  // Width alone lets a narrow desktop window through.
  const isTouch = useMuiMediaQuery('(pointer: coarse)');
  const [stepsOpen, setStepsOpen] = useState(false);
  return {
    available: !isDesktop && isTouch && way !== undefined,
    install: () => (way?.kind === 'prompt' ? way.prompt() : setStepsOpen(true)),
    dialog: way?.kind === 'steps' && (
      <StepsDialog steps={way.steps} open={stepsOpen} onClose={() => setStepsOpen(false)} />
    ),
  };
};

export const InstallButton = () => {
  const { available, install, dialog } = useInstall();
  return (
    <>
      {available && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<InstallMobileIcon />}
          onClick={install}
          sx={{ minHeight: 30, px: 1.5, fontSize: 13 }}
        >
          Install app
        </Button>
      )}
      {dialog}
    </>
  );
};

export const InstallHint = (props: { bottom: string }) => {
  const { available, install, dialog } = useInstall();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const seen = useAppLocalStorage('install.hintSeen', false);
  const show = available && isReturningFromSignIn && isSignedIn && !seen.value;

  return (
    <ThemeProvider theme={theme}>
      {show && (
        <Box
          role="dialog"
          aria-label="Install SlackMap"
          sx={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: props.bottom,
            zIndex: 5,
            p: 1.5,
            bgcolor: '#fff',
            borderRadius: `${radius.card}px`,
            boxShadow: shadow.float,
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              component="img"
              src="/icon-192.png"
              alt=""
              sx={{ flex: 'none', width: 40, height: 40, borderRadius: '10px' }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Add SlackMap to your home screen
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                Opens full screen, one tap from your lines.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 1.25 }}>
            <Button variant="outlined" size="small" onClick={() => seen.set(true)}>
              Not now
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                seen.set(true);
                install();
              }}
            >
              Install
            </Button>
          </Stack>
        </Box>
      )}
      {dialog}
    </ThemeProvider>
  );
};
