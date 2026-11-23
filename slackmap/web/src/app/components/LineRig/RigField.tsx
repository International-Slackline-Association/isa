import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import SensorsIcon from '@mui/icons-material/Sensors';
import ShareIcon from '@mui/icons-material/Share';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { appColors } from 'styles/theme/colors';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import { NoPassError, consumeManageLinkFromUrl, endRig, extendRig, manageCodeFor, manageLinkOf, reportRig } from './rigApi';
import {
  calendarFile,
  dateInputBounds,
  expiresWithinADay,
  formatReportedAgo,
  formatUntil,
  untilFromDateInput,
  untilPresets,
} from './rigTimes';

const rigColor = appColors.riggedColor;
const explainerSeenKey = 'app.rigExplainerSeen';

interface Props {
  lineId: string;
  lineName: string;
  rig?: { until: number; reportedAt: number };
  onChanged: () => void;
}

// Everything happens inside the card, so it stays within the detail panel on desktop.
type Step = 'explainer' | 'activate' | 'extend' | 'confirmEnd' | 'done';

const Panel = (props: { live?: boolean; children: React.ReactNode }) => (
  <Box
    sx={{
      borderRadius: 2,
      p: 1.5,
      bgcolor: props.live ? '#fff3e6' : 'action.hover',
      border: '1px solid',
      borderColor: props.live ? '#ffcf99' : 'divider',
    }}
  >
    <Stack spacing={1.5}>{props.children}</Stack>
  </Box>
);

const UntilPicker = (props: {
  title: string;
  confirmText: string;
  after?: number;
  onCancel: () => void;
  onConfirm: (until: number) => Promise<void>;
}) => {
  const presets = untilPresets().filter((p) => !props.after || p.until > props.after);
  const [until, setUntil] = useState(presets[0]?.until ?? 0);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Typography variant="body2Bold">{props.title}</Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        {presets.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            color={until === p.until ? 'primary' : 'default'}
            onClick={() => setUntil(p.until)}
          />
        ))}
      </Stack>
      <TextField
        type="date"
        size="small"
        label="Or pick a date"
        slotProps={{ inputLabel: { shrink: true }, htmlInput: dateInputBounds() }}
        onChange={(e) => e.target.value && setUntil(untilFromDateInput(e.target.value))}
      />
      <Typography variant="body2" color="text.secondary">
        {until ? `Until ${formatUntil(until)}. It disappears from the map after that.` : 'Pick a date.'}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="outlined" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={busy || !until}
          onClick={async () => {
            setBusy(true);
            await props.onConfirm(until).finally(() => setBusy(false));
          }}
        >
          {props.confirmText}
        </Button>
      </Stack>
    </>
  );
};

export const RigField = (props: Props) => {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();

  const [code, setCode] = useState<string | undefined>();
  const [step, setStep] = useState<Step | undefined>();
  const [doneUntil, setDoneUntil] = useState<number>();

  useEffect(() => {
    consumeManageLinkFromUrl(props.lineId);
    setCode(manageCodeFor(props.lineId, props.rig));
  }, [props.lineId, props.rig?.reportedAt]);

  useEffect(() => setStep(undefined), [props.lineId]);

  const rig = props.rig;
  const manageLink = code ? manageLinkOf(props.lineId, code) : undefined;

  const onActivateClicked = () => {
    if (!isSignedIn) return showSignInDialog();
    let seen = false;
    try {
      seen = localStorage.getItem(explainerSeenKey) === 'true';
    } catch {}
    setStep(seen ? 'activate' : 'explainer');
  };

  const fail = (error: unknown) => {
    if (error instanceof NoPassError) {
      dispatch(
        showErrorNotification(
          'No pass to activate with yet. Passes arrive in the background while you are signed in; if you used this month’s, they come back next month.',
        ),
      );
    } else {
      dispatch(showErrorNotification((error as Error).message));
    }
  };

  const onActivate = async (until: number) => {
    try {
      const result = await reportRig(props.lineId, until);
      setCode(manageCodeFor(props.lineId, result));
      setDoneUntil(result.until);
      // The card reloads on onChanged and would drop this step, so it reloads when the step is closed.
      setStep('done');
    } catch (error) {
      fail(error);
    }
  };

  const onExtend = async (until: number) => {
    if (!code) return;
    try {
      await extendRig(props.lineId, code, until);
      setStep(undefined);
      dispatch(showSuccessNotification(`Extended until ${formatUntil(until)}`));
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onTakeDown = async () => {
    if (!code) return;
    try {
      await endRig(props.lineId, code);
      setCode(undefined);
      setStep(undefined);
      dispatch(showSuccessNotification('Marked as taken down'));
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onShare = async () => {
    if (!manageLink) return;
    const text = `Manage the rig of ${props.lineName} on SlackMap`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SlackMap manage link', text, url: manageLink });
        return;
      }
      await navigator.clipboard.writeText(manageLink);
      dispatch(showInfoNotification('Manage link copied'));
    } catch {}
  };

  const onCalendar = (until: number) => {
    if (!manageLink) return;
    const url = URL.createObjectURL(calendarFile(props.lineName, until, manageLink));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slackmap-rig-reminder.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'explainer') {
    return (
      <Panel>
        <Typography variant="body2Bold">Activating is anonymous</Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
          <Typography component="li" variant="body2">
            <b>SlackMap cannot know it was you.</b> The report reaches us without your account.
          </Typography>
          <Typography component="li" variant="body2">
            We only learn that <i>a</i> SlackMap member sent it, through an anonymous pass your browser got in
            advance.
          </Typography>
          <Typography component="li" variant="body2">
            You get a <b>manage link</b>. Whoever has it can extend or take down this rig: keep it, or share it with
            your other devices or your crew.
          </Typography>
          <Typography component="li" variant="body2">
            People nearby may still guess who rigs here. We can’t protect against that.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" onClick={() => setStep(undefined)}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              try {
                localStorage.setItem(explainerSeenKey, 'true');
              } catch {}
              setStep('activate');
            }}
          >
            Got it
          </Button>
        </Stack>
      </Panel>
    );
  }

  if (step === 'activate' && !rig) {
    return (
      <Panel>
        <UntilPicker
          title="Rigged until"
          confirmText="Activate"
          onCancel={() => setStep(undefined)}
          onConfirm={onActivate}
        />
      </Panel>
    );
  }

  if (step === 'done' && doneUntil) {
    return (
      <Panel live>
        <Typography variant="body2Bold">✓ Active until {formatUntil(doneUntil)}</Typography>
        <Typography variant="body2">
          It shows on the map within a minute. Others see when it was reported, never who.
        </Typography>
        <Button variant="contained" startIcon={<EventIcon />} onClick={() => onCalendar(doneUntil)}>
          Add reminder to calendar
        </Button>
        <Button variant="outlined" startIcon={<ShareIcon />} onClick={onShare}>
          Share manage link
        </Button>
        <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
          <LockIcon fontSize="small" />
          <Typography variant="caption">
            The manage link is saved in this browser. Whoever has it can extend or take down this rig.
          </Typography>
        </Stack>
        <Button
          onClick={() => {
            setStep(undefined);
            props.onChanged();
          }}
        >
          Done
        </Button>
      </Panel>
    );
  }

  if (!rig) {
    return (
      <>
        <SignInDialog />
        <Button variant="contained" fullWidth startIcon={<SensorsIcon />} onClick={onActivateClicked}>
          {isSignedIn ? 'Activate' : 'Sign in to activate'}
        </Button>
      </>
    );
  }

  return (
    <Panel live>
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip label="RIGGED" size="small" sx={{ bgcolor: rigColor, color: '#fff', fontWeight: 800 }} />
          <Typography variant="body2Bold">until {formatUntil(rig.until)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Reported {formatReportedAgo(rig.reportedAt)}
          {code ? ' · you have the manage link' : ''}
        </Typography>
      </Box>
      {code && step === 'extend' && (
        <UntilPicker
          title="Extend until"
          confirmText="Extend"
          after={rig.until}
          onCancel={() => setStep(undefined)}
          onConfirm={onExtend}
        />
      )}
      {code && step === 'confirmEnd' && (
        <>
          <Typography variant="body2">Mark as taken down? It disappears from the map and the manage link stops working.</Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" sx={{ bgcolor: rigColor }} onClick={onTakeDown}>
              Taken down
            </Button>
          </Stack>
        </>
      )}
      {code && !step && (
        <>
          {expiresWithinADay(rig.until) && (
            <Alert severity="warning">
              Expires {formatUntil(rig.until)} and disappears from the map. Still up?
            </Alert>
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={() => setStep('extend')}>
              Extend
            </Button>
            <Button fullWidth variant="contained" sx={{ bgcolor: rigColor }} onClick={() => setStep('confirmEnd')}>
              Taken down
            </Button>
          </Stack>
          <Button size="small" startIcon={<ShareIcon />} sx={{ alignSelf: 'flex-start' }} onClick={onShare}>
            Share manage link
          </Button>
        </>
      )}
    </Panel>
  );
};
