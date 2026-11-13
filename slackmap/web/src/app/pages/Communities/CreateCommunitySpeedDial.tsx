import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import { SpeedDial, SpeedDialAction } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { selectIsUserSignedIn, selectLastMapLocation } from 'app/slices/app/selectors';

export function CreateCommunitySpeedDial() {
  const navigate = useNavigate();
  const lastMapLocation = useSelector(selectLastMapLocation);
  const isUserSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();

  const onAddGroupClick = () => {
    if (!isUserSignedIn) {
      showSignInDialog();
      return;
    }
    navigate({
      pathname: '/communities/create/group',
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
      <SpeedDial
        sx={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          zIndex: 3,
        }}
        icon={<AddIcon />}
        ariaLabel={'speed dial'}
      >
        <SpeedDialAction
          icon={<GroupIcon />}
          slotProps={{ tooltip: { title: 'Add a new slackline group' } }}
          onClick={onAddGroupClick}
          sx={{
            color: (t) => t.palette.primary.main,
          }}
        />
      </SpeedDial>
    </>
  );
}
