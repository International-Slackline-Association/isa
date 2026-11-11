import { appActions } from 'store/state';

export function showSuccessNotification(message: string) {
  return appActions.updateSnackbarNotification({
    message: message,
    severity: 'success',
  });
}

export function showErrorNotification(message: string) {
  return appActions.updateSnackbarNotification({
    message: message,
    severity: 'error',
  });
}

export function showWarningNotification(message: string) {
  return appActions.updateSnackbarNotification({
    message: message,
    severity: 'warning',
  });
}

export function showInfoNotification(message: string) {
  return appActions.updateSnackbarNotification({
    message: message,
    severity: 'info',
  });
}

export function convertGoogleDriveImageToUrl(url?: string) {
  // url format: https://drive.google.com/file/d/XXXX/view?usp=drive_link
  const id = url?.split('/')[5];
  const format = `https://lh3.googleusercontent.com/d/${id}`;
  return format;
}
