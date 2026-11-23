import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import AddIcon from '@mui/icons-material/Add';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import GroupIcon from '@mui/icons-material/Group';
import PentagonIcon from '@mui/icons-material/Pentagon';
import { Box, Button, Fab, ListItemIcon, Menu, MenuItem } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { SlacklineFeatureIcon } from 'app/components/Icons/SlacklineFeatureIcon';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { selectIsUserSignedIn, selectLastMapLocation } from 'app/slices/app/selectors';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

const items = [
  { label: 'Add a line', path: '/create/line', icon: <SlacklineFeatureIcon fontSize="small" /> },
  { label: 'Add a spot', path: '/create/spot', icon: <PentagonIcon fontSize="small" /> },
  { label: 'Add an access guide', path: '/create/guide', icon: <FollowTheSignsIcon fontSize="small" /> },
  { label: 'Add a slackline group', path: '/communities/create/group', icon: <GroupIcon fontSize="small" /> },
];

// One entry point for everything a person can add, on both maps.
export const AddMenu = () => {
  const navigate = useNavigate();
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
          disableElevation
          sx={{
            position: 'absolute',
            top: 12,
            right: 16,
            zIndex: 3,
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
          }}
        >
          Add
        </Button>
      ) : (
        <Fab
          color="primary"
          aria-label="Add"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ position: 'absolute', bottom: 72, right: 16, zIndex: 3 }}
        >
          <AddIcon />
        </Fab>
      )}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {items.map((item) => (
          <MenuItem key={item.path} onClick={() => open(item.path)}>
            <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
            <Box component="span">{item.label}</Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
