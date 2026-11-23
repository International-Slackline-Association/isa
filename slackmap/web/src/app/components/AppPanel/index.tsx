import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleIcon from '@mui/icons-material/People';
import SensorsIcon from '@mui/icons-material/Sensors';
import {
  Badge,
  Box,
  ButtonBase,
  IconButton,
  Link,
  Stack,
  SwipeableDrawer,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';

import { getActiveLinePoints } from 'app/api/geojson-data';
import { useInfoDialog } from 'app/components/Dialogs/useInfoDialog';
import { useSessionReady } from 'app/session';
import { appColors } from 'styles/theme/colors';
import { panelTheme } from 'styles/theme/panelTheme';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';
import { useWindowHeight } from 'utils/hooks/useWindowHeight';

import { FAQ } from './FAQ';
import { Profile } from './Profile';
import { LatestChangesSection, ActiveNowSection, TopContributorsStrip } from './ActivitySection';
import { CommunitiesSection } from './CommunitiesSection';

const expandedWidth = 320;
const collapsedWidth = 56;

type PanelTab = 'activity' | 'communities';

const tabOfPath = (pathname: string): PanelTab =>
  pathname.startsWith('/communities') ? 'communities' : 'activity';

// The panel is open on the two landing maps; anywhere else a card or a form needs the room.
const isLandingPath = (pathname: string) => pathname === '/' || pathname === '/communities';

const useActiveCount = () => {
  const sessionReady = useSessionReady();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!sessionReady) return;
    const load = () => getActiveLinePoints().then((lines) => setCount(lines.length));
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [sessionReady]);
  return count;
};

const PanelFooter = () => {
  const { InfoDialog, showInfoDialog } = useInfoDialog();
  const linkSx = {
    fontSize: '0.7rem',
    cursor: 'pointer',
    color: 'text.secondary',
    textDecoration: 'none',
    '&:hover': { color: 'text.primary' },
  };
  return (
    <Box>
      <InfoDialog />
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        <Link
          component="button"
          sx={linkSx}
          onClick={() => showInfoDialog({ title: 'FAQ', description: <FAQ /> })}
        >
          FAQ
        </Link>
        <Link sx={linkSx} href="mailto:slackmap@slacklineinternational.org?subject=Slackmap%20Contact">
          Contact
        </Link>
        <Link sx={linkSx} href="https://github.com/International-Slackline-Association/isa" target="_blank">
          Open source
        </Link>
        <Link sx={linkSx} component={RouterLink} to="/terms">
          Terms
        </Link>
      </Stack>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
        ©{' '}
        <Link href="https://www.slacklineinternational.org" target="_blank" color="inherit" underline="hover">
          International Slackline Association
        </Link>
        . Map data: all rights reserved.
      </Typography>
    </Box>
  );
};

const SegmentedTabs = (props: {
  value: PanelTab;
  options: { value: PanelTab; label: string; onSelect: () => void }[];
}) => (
  <Stack direction="row" sx={{ mt: 2, p: 0.5, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)' }}>
    {props.options.map((o) => {
      const selected = o.value === props.value;
      return (
        <ButtonBase
          key={o.value}
          onClick={o.onSelect}
          sx={{
            flex: 1,
            py: 0.75,
            borderRadius: 999,
            fontSize: '0.85rem',
            fontWeight: selected ? 600 : 500,
            color: selected ? 'text.primary' : 'text.secondary',
            bgcolor: selected ? 'rgba(255,255,255,0.12)' : 'transparent',
            transition: 'background-color 120ms',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {o.label}
        </ButtonBase>
      );
    })}
  </Stack>
);

const PanelContent = (props: { onNavigate?: () => void; onCollapse?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabOfPath(location.pathname);

  return (
    <Stack sx={{ height: '100%', p: 2, pb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Link component={RouterLink} to="/" onClick={props.onNavigate} sx={{ display: 'flex' }}>
          <img src="/images/slackmapLogo.png" alt="SlackMap" style={{ height: 28 }} />
        </Link>
        {props.onCollapse && (
          <Tooltip title="Collapse">
            <IconButton size="small" onClick={props.onCollapse}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Box sx={{ mt: 2, color: 'text.primary' }}>
        <Profile />
      </Box>
      <SegmentedTabs
        value={tab}
        options={[
          { value: 'activity', label: 'Activity', onSelect: () => navigate('/') },
          { value: 'communities', label: 'Communities', onSelect: () => navigate('/communities') },
        ]}
      />
      <Box sx={{ flex: 1, overflowY: 'auto', mx: -1, px: 1 }}>
        {tab === 'activity' ? (
          <>
            <ActiveNowSection onNavigate={props.onNavigate} />
            <LatestChangesSection onNavigate={props.onNavigate} />
          </>
        ) : (
          <CommunitiesSection />
        )}
      </Box>
      {tab === 'activity' && <TopContributorsStrip />}
      <PanelFooter />
    </Stack>
  );
};

const CollapsedRail = (props: { onExpand: () => void; activeCount: number }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = tabOfPath(location.pathname);
  const item = (selected: boolean) => ({
    borderRadius: 2,
    color: selected ? 'primary.main' : 'text.secondary',
    backgroundColor: selected ? 'action.selected' : undefined,
  });

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', height: '100%', py: 2 }}>
      <ButtonBase component={RouterLink} to="/" sx={{ borderRadius: 1 }}>
        <img src="/images/slackmapLogo.png" alt="SlackMap" style={{ width: 40 }} />
      </ButtonBase>
      <Tooltip title="Activity" placement="right">
        <IconButton sx={item(tab === 'activity')} onClick={() => navigate('/')}>
          <Badge badgeContent={props.activeCount} sx={{ '& .MuiBadge-badge': { bgcolor: appColors.activeColor, color: '#fff' } }}>
            <SensorsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Communities" placement="right">
        <IconButton sx={item(tab === 'communities')} onClick={() => navigate('/communities')}>
          <PeopleIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1 }} />
      <Tooltip title="Expand" placement="right">
        <IconButton onClick={props.onExpand}>
          <ChevronRightIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const MobileSheet = (props: { activeCount: number }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const tab = tabOfPath(location.pathname);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      {(isLandingPath(location.pathname) || location.pathname === '/terms') && (
        <ButtonBase
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: 56,
            zIndex: 5,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider', mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {tab === 'communities'
              ? 'Slackline communities'
              : props.activeCount > 0
                ? `${props.activeCount} ${props.activeCount === 1 ? 'line' : 'lines'} active now · Activity`
                : 'Activity & communities'}
          </Typography>
        </ButtonBase>
      )}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disableSwipeToOpen
        slotProps={{ paper: { sx: { height: '85vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
      >
        <PanelContent onNavigate={() => setOpen(false)} />
      </SwipeableDrawer>
    </>
  );
};

export const AppPanel = (props: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isDesktop } = useMediaQuery();
  const windowHeight = useWindowHeight();
  const activeCount = useActiveCount();
  const [expanded, setExpanded] = useState(isLandingPath(location.pathname));

  useEffect(() => setExpanded(isLandingPath(location.pathname)), [location.pathname]);

  // The page keeps its place in the tree on both sizes, so crossing the breakpoint keeps its state.
  return (
    <Box sx={{ display: 'flex', height: windowHeight }}>
      <ThemeProvider theme={panelTheme}>
        {isDesktop && (
          <Box
            component="nav"
            sx={{
              width: expanded ? expandedWidth : collapsedWidth,
              flexShrink: 0,
              bgcolor: 'background.paper',
              color: 'text.primary',
              zIndex: 5,
              transition: 'width 150ms',
              overflow: 'hidden',
            }}
          >
            {expanded ? (
              <PanelContent onCollapse={() => setExpanded(false)} />
            ) : (
              <CollapsedRail onExpand={() => setExpanded(true)} activeCount={activeCount} />
            )}
          </Box>
        )}
      </ThemeProvider>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: '100%', position: 'relative' }}>
        {props.children}
      </Box>
      <ThemeProvider theme={panelTheme}>
        {!isDesktop && <MobileSheet activeCount={activeCount} />}
      </ThemeProvider>
    </Box>
  );
};
