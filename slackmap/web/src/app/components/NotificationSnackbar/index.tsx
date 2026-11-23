import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';

import { appActions } from 'app/slices/app';
import { selectSnackbarNotification } from 'app/slices/app/selectors';
import { shadow, ui } from 'styles/theme/ui';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

const NotificationSnackbar = () => {
  const dispatch = useDispatch();
  const snackbarNotification = useSelector(selectSnackbarNotification);
  const [lastSnackbarNotification, setLastSnackbarNotification] = useState(snackbarNotification);

  useEffect(() => {
    if (snackbarNotification) {
      setLastSnackbarNotification(snackbarNotification);
    }
  }, [snackbarNotification]);

  const onClose = () => {
    dispatch(appActions.updateSnackbarNotification(null));
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={Boolean(snackbarNotification)}
      autoHideDuration={snackbarNotification?.duration ?? 3000}
      onClose={onClose}
      slots={{ transition: SlideTransition }}
    >
      <Alert
        variant="filled"
        onClose={onClose}
        severity={lastSnackbarNotification?.severity}
        sx={{
          borderRadius: 999,
          px: 2,
          py: 0.25,
          fontWeight: 500,
          boxShadow: shadow.float,
          bgcolor: lastSnackbarNotification?.severity === 'error' ? 'error.main' : ui.toast,
          color: '#fff',
          '& .MuiAlert-icon': {
            color: lastSnackbarNotification?.severity === 'success' ? '#6FD86F' : '#fff',
          },
        }}
      >
        {lastSnackbarNotification?.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
