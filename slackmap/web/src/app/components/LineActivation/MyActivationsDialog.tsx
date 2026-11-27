import { useNavigate } from 'react-router';

import { ButtonBase, Stack, Typography } from '@mui/material';

import { meApi } from 'app/api/me-api';
import { PopupDialog } from 'app/components/Dialogs/PopupDialog';
import { LoadingIndicator } from 'app/components/LoadingIndicator';
import { ui } from 'styles/theme/ui';

import { formatStart, formatUntil } from './activationTimes';

export const MyActivationsDialog = (props: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { data, isFetching } = meApi.useGetMyActivationsQuery(undefined, { skip: !props.open, refetchOnMountOrArgChange: true });
  const activations = data?.activations ?? [];

  return (
    <PopupDialog
      open={props.open}
      onClose={props.onClose}
      title="My activations"
      description="What you activated with your name. Open one to manage it, no link needed."
    >
      {isFetching && !data ? (
        <LoadingIndicator />
      ) : activations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing active or planned with your name.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {activations.map((a) => (
            <ButtonBase
              key={`${a.featureType}:${a.featureId}:${a.kind}`}
              onClick={() => {
                props.onClose();
                navigate(`/${a.featureType}/${a.featureId}`);
              }}
              sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 1.25, borderRadius: '12px', bgcolor: ui.fill, '&:hover': { bgcolor: ui.fillHover } }}
            >
              <Typography variant="body2Bold">{a.name || `Unnamed ${a.featureType}`}</Typography>
              <Typography variant="caption" color="text.secondary">
                {a.kind === 'dates'
                  ? `Dates from ${formatStart(a.from)} until ${formatUntil(a.until)}`
                  : a.from > Date.now() / 1000
                    ? `From ${formatStart(a.from)} until ${formatUntil(a.until)}`
                    : `Active until ${formatUntil(a.until)}`}
              </Typography>
            </ButtonBase>
          ))}
        </Stack>
      )}
    </PopupDialog>
  );
};
