import { Component, FC, ReactNode } from 'react';

import { Alert, Backdrop, Stack, Typography } from '@mui/material';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorBoundyFallBack({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Backdrop
      sx={{ p: 2 }}
      open={true}
      onClick={() => {
        resetErrorBoundary();
      }}
    >
      <Alert severity="error" sx={{ alignItems: 'center' }}>
        <Stack spacing={2}>
          <Typography variant="body2Bold">An unexpected error occured in your browser</Typography>
          <Typography variant="body2">
            We have been notified of the error and will investigate it as soon as possible. <br />
            Write to <b>slackmap@slacklineinternational.org</b> if you need help.
          </Typography>
          <Typography variant="body2">
            <b>Error message: </b>
            {error.message}
          </Typography>
        </Stack>
      </Alert>
    </Backdrop>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.log('Error: ', error);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <ErrorBoundyFallBack
          error={error}
          resetErrorBoundary={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundry<P extends object>(WrappedComponent: FC<P>) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
