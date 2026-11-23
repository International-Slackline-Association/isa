import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import AddIcon from '@mui/icons-material/Add';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import GroupIcon from '@mui/icons-material/Group';
import PentagonIcon from '@mui/icons-material/Pentagon';
import { Box, Button, Fab, ListItemIcon, Menu, MenuItem } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { SlacklineFeatureIcon } from 'app/components/Icons/SlacklineFeatureIcon';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { selectIsUserSignedIn, selectLastMapLocation } from 'app/slices/app/selectors';
import { shadow, ui } from 'styles/theme/ui';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

const items = [
  { label: 'Add a line', path: '/create/line', icon: <SlacklineFeatureIcon fontSize="small" /> },
  { label: 'Add a spot', path: '/create/spot', icon: <PentagonIcon fontSize="small" /> },
  { label: 'Add an access guide', path: '/create/guide', icon: <FollowTheSignsIcon fontSize="small" /> },
  { label: 'Add a slackline group', path: '/communities/create/group', icon: <GroupIcon fontSize="small" /> },
];

export const AddMenu = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Next to the open blue panel a blue button would vanish.
  const besideOpenPanel = pathname === '/' || pathname === '/communities';
  const { isDesktop } = useMediaQuery();
  const lastMapLocation = useSelector(selectLastMapLocation);
  const isUserSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (path: string) => {
    setAnchor(null);
    if (!isUserSignedIn) {
      showSignInDialog();
      return;
    }
    navigate({
      pathname: path,
      search: lastMapLocation
        ? `map=${mapUrlSearchParams.stringify(
            lastMapLocation.longitude,
            lastMapLocation.latitude,
            lastMapLocation.zoom,
          )}`
        : undefined,
    });
  };

  return (
    <>
      <SignInDialog />
      {isDesktop ? (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            position: 'absolute',
            top: 12,
            right: 'calc(var(--card-inset, 0px) + 12px)',
            zIndex: 3,
            minHeight: 38,
            boxShadow: shadow.float,
            ...(besideOpenPanel && { bgcolor: '#fff', color: ui.blueDark, '&:hover': { bgcolor: ui.blueTint } }),
          }}
        >
          Add
        </Button>
      ) : (
        <Fab
          color="primary"
          aria-label="Add"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ position: 'absolute', bottom: 72, right: 12, zIndex: 3 }}
        >
          <AddIcon />
        </Fab>
      )}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {items.map((item) => (
          <MenuItem key={item.path} onClick={() => open(item.path)}>
            <ListItemIcon sx={{ color: ui.muted }}>{item.icon}</ListItemIcon>
            <Box component="span">{item.label}</Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
