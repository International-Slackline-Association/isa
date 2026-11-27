import { useState } from 'react';
import { useDispatch } from 'react-redux';

import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ShareIcon from '@mui/icons-material/Share';
import { Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';

import { MyActivation } from 'app/api/me-api';
import { format } from 'date-fns';
import { ui } from 'styles/theme/ui';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import { DatesPicker } from './DatesPicker';
import { ActivationDate, ActivationTarget, ManageAuth, changeDates, manageLinkOf, setRemind, stopDates } from './activationApi';

export type PublicDates = { dates: ActivationDate[]; activatedAt: number; activatedBy?: string };

type Step = 'edit' | 'confirmStop';

const timeOf = (seconds: number) => format(new Date(seconds * 1000), 'HH:mm');

export const ActivationDatesField = (props: {
  target: ActivationTarget;
  dates?: PublicDates;
  link?: { code: string; activatedAt: number };
  own?: MyActivation;
  // False while one of the dates is the current activation: the card above already shows it.
  showNext: boolean;
  onChanged: () => void;
}) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>();
  const [edited, setEdited] = useState<ActivationDate[]>([]);
  const [busy, setBusy] = useState(false);

  const dates = props.dates;
  if (!dates) return null;

  const now = Date.now() / 1000;
  const upcoming = dates.dates.filter((d) => (props.showNext ? d.until > now : d.from > now));
  const ownsLink = props.link?.activatedAt === dates.activatedAt;
  const auth: ManageAuth | undefined = ownsLink ? { code: props.link!.code } : props.own ? 'owner' : undefined;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      dispatch(showErrorNotification((error as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(async () => {
      await changeDates(props.target, auth!, edited);
      setStep(undefined);
      dispatch(showSuccessNotification('Dates saved'));
      props.onChanged();
    });

  const onStop = () =>
    run(async () => {
      await stopDates(props.target, auth!);
      setStep(undefined);
      dispatch(showSuccessNotification('Dates removed'));
      props.onChanged();
    });

  const onShare = async () => {
    if (!ownsLink) return;
    const url = manageLinkOf(props.target, props.link!);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SlackMap manage link', text: 'Manage these dates on SlackMap', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      dispatch(showInfoNotification('Manage link copied'));
    } catch {}
  };

  const next = upcoming[0];

  return (
    <Stack spacing={1.25} sx={{ borderRadius: '14px', p: 1.5, bgcolor: ui.fill }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <EventRepeatIcon sx={{ fontSize: 20, color: ui.activeInk }} />
        <Typography variant="body2Bold">
          {next ? `Next: ${format(new Date(next.from * 1000), 'EEE d MMM')}, ${timeOf(next.from)}–${timeOf(next.until)}` : 'No more dates after this one'}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {upcoming.length > 1 ? `${upcoming.length - 1} more date${upcoming.length > 2 ? 's' : ''}` : 'The last date'}
        {dates.activatedBy ? ` · by ${dates.activatedBy}` : ''}
        {ownsLink ? ' · you have the manage link' : props.own ? ' · you set them' : ''}
      </Typography>

      {auth && step === 'edit' && (
        <>
          <DatesPicker initial={dates.dates.filter((d) => d.until > now)} onChange={setEdited} />
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" color="active" disabled={busy || edited.length === 0} onClick={onSave}>
              Save dates
            </Button>
          </Stack>
        </>
      )}

      {auth && step === 'confirmStop' && (
        <>
          <Typography variant="subtitle1">Remove all dates?</Typography>
          <Typography variant="body2" color="text.secondary">
            A date that is on the map now stays until it ends.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Keep
            </Button>
            <Button fullWidth variant="contained" color="active" disabled={busy} onClick={onStop}>
              Remove dates
            </Button>
          </Stack>
        </>
      )}

      {auth && !step && (
        <>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('edit')}>
              Edit dates
            </Button>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('confirmStop')}>
              Remove dates
            </Button>
          </Stack>
          {props.own && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={props.own.remind}
                  onChange={(e) =>
                    run(async () => {
                      await setRemind(props.target, 'dates', e.target.checked);
                      props.onChanged();
                    })
                  }
                />
              }
              label={<Typography variant="body2">Email me before my last date</Typography>}
            />
          )}
          {ownsLink && (
            <Button size="small" startIcon={<ShareIcon />} sx={{ alignSelf: 'flex-start' }} onClick={onShare}>
              Share manage link
            </Button>
          )}
        </>
      )}
    </Stack>
  );
};
