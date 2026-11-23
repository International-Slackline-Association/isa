import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import LogoutIcon from '@mui/icons-material/Logout';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';

import { accountApi } from 'app/api/account-api';
import { appActions } from 'app/slices/app';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { AuthState } from 'app/slices/app/types';
import { signIn } from 'app/signIn';
import { theme } from 'styles/theme';

import { LoadingIndicator } from '../LoadingIndicator';

export const Profile = () => {
  const isSignedIn = useSelector(selectIsUserSignedIn);

  const { data: userInfo, isFetching } = accountApi.useGetBasicDetailsQuery(undefined, {
    skip: !isSignedIn,
  });

  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const name: string = userInfo?.name ?? '';
  const surname: string = userInfo?.surname || '';

  const signInClicked = () => {
    dispatch(appActions.updateAuthState(AuthState.SigningIn));
    signIn();
  };

  const signOutClicked = () => {
    setMenuAnchor(null);
    dispatch(appActions.updateAuthState(AuthState.SigningOut));
  };

  return !isSignedIn ? (
    <Button fullWidth variant="contained" onClick={signInClicked}>
      Sign in or sign up
    </Button>
  ) : isFetching ? (
    <LoadingIndicator />
  ) : (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', p: 0.75, borderRadius: '14px', bgcolor: 'action.hover' }}>
      <Avatar src={userInfo?.profilePictureUrl || ''} alt="" sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 600 }}>
        {name.substring(0, 1)}
        {surname.substring(0, 1)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2Bold" noWrap>
          {name} {surname}
        </Typography>
      </Box>
      <IconButton aria-label="Account" size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <ThemeProvider theme={theme}>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem
            component="a"
            href="https://account.slacklineinternational.org"
            target="_blank"
            rel="noopener"
            onClick={() => setMenuAnchor(null)}
          >
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            Your ISA profile
          </MenuItem>
          <MenuItem onClick={signOutClicked}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </ThemeProvider>
    </Stack>
  );
};
