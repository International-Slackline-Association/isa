import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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

import { getActivePoints, useMapDataVersion } from 'app/api/geojson-data';
import { useInfoDialog } from 'app/components/Dialogs/useInfoDialog';
import { InstallButton, InstallHint } from 'app/components/InstallApp';
import { useSessionReady } from 'app/session';
import { panelTheme } from 'styles/theme/panelTheme';
import { radius, safeArea, shadow, ui } from 'styles/theme/ui';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';
import { useWindowHeight } from 'utils/hooks/useWindowHeight';

import { FAQ } from './FAQ';
import { Profile } from './Profile';
import { LatestChangesSection, ActiveNowSection, TopContributorsStrip } from './ActivitySection';
import { CommunitiesSection } from './CommunitiesSection';
import { ActiveDot } from './PanelRow';
import { PanelInsetContext } from './panelInset';

const expandedWidth = 268;
const collapsedWidth = 52;
const inset = 12;
const barHeight = 56;



type PanelTab = 'activity' | 'communities';

const tabOfPath = (pathname: string): PanelTab =>
  pathname.startsWith('/communities') ? 'communities' : 'activity';

// The panel is open on the two landing maps; anywhere else a card or a form needs the room.
const isLandingPath = (pathname: string) => pathname === '/' || pathname === '/communities';

const useActiveCount = () => {
  const sessionReady = useSessionReady();
  const dataVersion = useMapDataVersion('features');
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!sessionReady) return;
    const load = () => getActivePoints().then((features) => setCount(features.length));
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [sessionReady, dataVersion]);
  return count;
};

const PanelFooter = () => {
  const { InfoDialog, showInfoDialog } = useInfoDialog();
  const linkSx = {
    fontSize: 12.5,
    fontWeight: 500,
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
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.5 }}>
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
  <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, p: 0.5, borderRadius: radius.pill, bgcolor: ui.onBlueFill }}>
    {props.options.map((o) => {
      const selected = o.value === props.value;
      return (
        <ButtonBase
          key={o.value}
          onClick={o.onSelect}
          sx={{
            flex: 1,
            py: 0.5,
            borderRadius: radius.pill,
            fontSize: 13.5,
            fontWeight: 600,
            color: selected ? ui.blueDark : 'text.secondary',
            bgcolor: selected ? '#fff' : 'transparent',
            transition: 'background-color 120ms',
            '&:hover': { color: selected ? ui.blueDark : 'text.primary' },
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
    <Stack sx={{ height: '100%', p: 1.75, pb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Link component={RouterLink} to="/" onClick={props.onNavigate} sx={{ display: 'flex' }}>
          <img src="/images/slackmapLogoOnBlue.svg" alt="SlackMap" style={{ height: 26 }} />
        </Link>
        <InstallButton />
        {props.onCollapse && (
          <Tooltip title="Collapse">
            <IconButton size="small" onClick={props.onCollapse}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Box sx={{ mt: 1.75, color: 'text.primary' }}>
        <Profile />
      </Box>
      <SegmentedTabs
        value={tab}
        options={[
          { value: 'activity', label: 'Activity', onSelect: () => navigate('/') },
          { value: 'communities', label: 'Communities', onSelect: () => navigate('/communities') },
        ]}
      />
      <Box sx={{ flex: 1, overflowY: 'auto', mx: -1, px: 1, scrollbarWidth: 'thin', scrollbarColor: `${ui.onBlueFill} transparent` }}>
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
  // Already on that page the path does not change, so the panel is opened here as well.
  const open = (path: string) => {
    navigate(path);
    props.onExpand();
  };
  const item = (selected: boolean) => ({
    width: 36,
    height: 36,
    borderRadius: '12px',
    color: selected ? 'text.primary' : 'text.secondary',
    backgroundColor: selected ? 'action.hover' : undefined,
  });

  return (
    <Stack spacing={1} sx={{ alignItems: 'center', height: '100%', py: 1.5 }}>
      <ButtonBase component={RouterLink} to="/" sx={{ borderRadius: 1, mb: 0.5 }}>
        <img src="/images/slackmapPinOnBlue.svg" alt="SlackMap" style={{ height: 30 }} />
      </ButtonBase>
      <Tooltip title="Activity" placement="right">
        <IconButton sx={item(tab === 'activity')} onClick={() => open('/')}>
          <Badge badgeContent={props.activeCount} sx={{ '& .MuiBadge-badge': { bgcolor: ui.active, color: ui.onActive } }}>
            <SensorsIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Communities" placement="right">
        <IconButton sx={item(tab === 'communities')} onClick={() => open('/communities')}>
          <PeopleIcon fontSize="small" />
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
  const swipeStartY = useRef(0);
  const tab = tabOfPath(location.pathname);

  const barShown = isLandingPath(location.pathname) || location.pathname === '/terms' || location.pathname === '/partner-integration';

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      {/* Held until the person is back on the map, so it never covers the form or card they signed in for. */}
      {barShown && <InstallHint bottom={`calc(${barHeight + 12}px + ${safeArea.bottom})`} />}
      {barShown && (
        <ButtonBase
          onClick={() => setOpen(true)}
          // MUI's swipe area swallows taps on iPhone, so the bar reads a swipe up itself.
          onTouchStart={(e) => (swipeStartY.current = e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (swipeStartY.current - e.changedTouches[0].clientY > 24) setOpen(true);
          }}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: `calc(${barHeight}px + ${safeArea.bottom})`,
            zIndex: 5,
            px: 2,
            pt: 1.25,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: shadow.float,
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
          }}
        >
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: ui.onBlueFillHover, mx: 'auto', mb: 1 }} />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {tab === 'activity' && props.activeCount > 0 && <ActiveDot />}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {tab === 'communities'
                  ? 'Slackline communities'
                  : props.activeCount > 0
                    ? `${props.activeCount} ${props.activeCount === 1 ? 'line' : 'lines'} active now`
                    : 'Latest on SlackMap'}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">{tab === 'communities' ? 'Communities' : 'Activity'}</Typography>
              <ExpandLessIcon fontSize="small" />
            </Stack>
          </Stack>
        </ButtonBase>
      )}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disableSwipeToOpen
        slotProps={{
          paper: { sx: { height: '85vh', pb: safeArea.bottom, borderTopLeftRadius: 18, borderTopRightRadius: 18 } },
        }}
      >
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: ui.onBlueFillHover, mx: 'auto', mt: 1 }} />
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

  // The panel floats over the page; --panel-inset tells what sits on the map's left edge how far to stay clear.
  // The page keeps its place in the tree on both sizes, so crossing the breakpoint keeps its state.
  const panelInset = isDesktop ? (expanded ? expandedWidth : collapsedWidth) + 2 * inset : 0;
  return (
    <Box sx={{ position: 'relative', height: windowHeight, '--panel-inset': `${panelInset}px` }}>
      <ThemeProvider theme={panelTheme}>
        {isDesktop && (
          <Box
            component="nav"
            sx={{
              position: 'absolute',
              top: inset,
              bottom: inset,
              left: inset,
              width: expanded ? expandedWidth : collapsedWidth,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: `${radius.card}px`,
              boxShadow: shadow.float,
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
      <Box component="main" sx={{ height: '100%', position: 'relative' }}>
        <PanelInsetContext.Provider value={panelInset}>{props.children}</PanelInsetContext.Provider>
      </Box>
      <ThemeProvider theme={panelTheme}>
        {!isDesktop && <MobileSheet activeCount={activeCount} />}
      </ThemeProvider>
    </Box>
  );
};
