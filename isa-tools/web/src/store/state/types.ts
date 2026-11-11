export interface AppState {
  snackbarNotification: SnackbarNotification;
}
export type SnackbarNotification = {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
} | null;
