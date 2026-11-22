import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Typography,
} from '@mui/material';

import { meApi } from 'app/api/me-api';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';

// Writes to the map are refused until it is accepted.
export const ContributorAgreementDialog = () => {
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const { data } = meApi.useGetContributorAgreementQuery(undefined, { skip: !isSignedIn });
  const [accept, { isLoading }] = meApi.useAcceptContributorAgreementMutation();
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const open = Boolean(isSignedIn && data && !data.accepted && !dismissed);

  return (
    <Dialog open={open} onClose={() => setDismissed(true)} maxWidth="xs">
      <DialogTitle>Your contributions to SlackMap</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ marginBottom: 2 }}>
          SlackMap&apos;s data is free for slackliners, not for apps that copy it. So that ISA can stop
          them, you let ISA use what you add (lines, spots, guides, photos, texts) and act against
          copies. It stays yours: use it anywhere, delete it here anytime. Only add texts and photos you
          made yourself or may share.
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
          label={
            <Typography variant="body2">
              I accept the{' '}
              <Link href="/terms#contributor-agreement" target="_blank">
                contributor agreement
              </Link>
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDismissed(true)}>Not now</Button>
        <Button
          variant="contained"
          disabled={!checked || isLoading || !data}
          onClick={() => data && accept(data.version)}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};
