import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SensorsIcon from '@mui/icons-material/Sensors';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Alert, Box, Button, ButtonBase, Chip, Stack, TextField, Typography } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { appColors } from 'styles/theme/colors';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import {
  NoPassError,
  activateAnonymously,
  activateWithName,
  consumeManageLinkFromUrl,
  deactivate,
  extendActivation,
  manageCodeFor,
  manageLinkOf,
} from './activationApi';
import {
  calendarFile,
  dateInputBounds,
  expiresWithinADay,
  formatActivatedAgo,
  formatUntil,
  untilFromDateInput,
  untilPresets,
} from './activationTimes';

const activeColor = appColors.activeColor;
const explainerSeenKey = 'app.activationExplainerSeen';

interface Props {
  lineId: string;
  lineName: string;
  activation?: { until: number; activatedAt: number; activatedBy?: string };
  onChanged: () => void;
}

type Mode = 'anonymous' | 'named';

// Everything happens inside the card, so it stays within the detail panel on desktop.
type Step = 'explainer' | 'activate' | 'extend' | 'confirmDeactivate' | 'done';

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

const ModeOption = (props: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) => (
  <ButtonBase
    onClick={props.onClick}
    sx={{
      flex: 1,
      p: 1,
      borderRadius: 1.5,
      border: '2px solid',
      borderColor: props.selected ? 'primary.main' : 'divider',
      bgcolor: 'background.paper',
      textAlign: 'left',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    }}
  >
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: props.selected ? 'primary.main' : 'text.primary' }}>
        {props.icon}
        <Typography variant="body2Bold">{props.title}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {props.text}
      </Typography>
    </Stack>
  </ButtonBase>
);

const UntilPicker = (props: {
  title: string;
  after?: number;
  withMode?: boolean;
  confirmText: (mode: Mode) => string;
  onCancel: () => void;
  onConfirm: (until: number, mode: Mode) => Promise<void>;
}) => {
  const presets = untilPresets().filter((p) => !props.after || p.until > props.after);
  const [until, setUntil] = useState(presets[0]?.until ?? 0);
  const [mode, setMode] = useState<Mode>('anonymous');
  const [busy, setBusy] = useState(false);

  return (
    <>
      {props.withMode && (
        <Stack direction="row" spacing={1}>
          <ModeOption
            selected={mode === 'anonymous'}
            icon={<VisibilityOffIcon fontSize="small" />}
            title="Anonymous"
            text="SlackMap cannot know it was you."
            onClick={() => setMode('anonymous')}
          />
          <ModeOption
            selected={mode === 'named'}
            icon={<PersonIcon fontSize="small" />}
            title="With my name"
            text="Your name shows on this line while it is active."
            onClick={() => setMode('named')}
          />
        </Stack>
      )}
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
            await props.onConfirm(until, mode).finally(() => setBusy(false));
          }}
        >
          {props.confirmText(mode)}
        </Button>
      </Stack>
    </>
  );
};

export const ActivationField = (props: Props) => {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();

  const [code, setCode] = useState<string | undefined>();
  const [step, setStep] = useState<Step | undefined>();
  const [doneUntil, setDoneUntil] = useState<number>();

  useEffect(() => {
    consumeManageLinkFromUrl(props.lineId);
    setCode(manageCodeFor(props.lineId, props.activation));
  }, [props.lineId, props.activation?.activatedAt]);

  useEffect(() => setStep(undefined), [props.lineId]);

  const activation = props.activation;
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
          'No pass to activate anonymously yet. Passes arrive in the background while you are signed in; if you used this month’s, they come back next month.',
        ),
      );
    } else {
      dispatch(showErrorNotification((error as Error).message));
    }
  };

  const onActivate = async (until: number, mode: Mode) => {
    try {
      const result =
        mode === 'named'
          ? await activateWithName(props.lineId, until)
          : await activateAnonymously(props.lineId, until);
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
      await extendActivation(props.lineId, code, until);
      setStep(undefined);
      dispatch(showSuccessNotification(`Extended until ${formatUntil(until)}`));
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onDeactivate = async () => {
    if (!code) return;
    try {
      await deactivate(props.lineId, code);
      setCode(undefined);
      setStep(undefined);
      dispatch(showSuccessNotification('Deactivated'));
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onShare = async () => {
    if (!manageLink) return;
    const text = `Manage the activation of ${props.lineName} on SlackMap`;
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
    a.download = 'slackmap-activation-reminder.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'explainer') {
    return (
      <Panel>
        <Typography variant="body2Bold">Activating a line</Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
          <Typography component="li" variant="body2">
            You choose: <b>anonymous</b>, or <b>with your name</b>.
          </Typography>
          <Typography component="li" variant="body2">
            <b>Anonymous: SlackMap cannot know it was you.</b> The activation reaches us without your account; we
            only learn that <i>a</i> SlackMap member sent it, through an anonymous pass your browser got in advance.
          </Typography>
          <Typography component="li" variant="body2">
            Either way you get a <b>manage link</b>. Whoever has it can extend or deactivate: keep it, or share it with
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

  if (step === 'activate' && !activation) {
    return (
      <Panel>
        <UntilPicker
          withMode
          title="Active until"
          confirmText={(mode) => (mode === 'named' ? 'Activate with my name' : 'Activate')}
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
        <Typography variant="body2">It shows on the map within a minute.</Typography>
        <Button variant="contained" startIcon={<EventIcon />} onClick={() => onCalendar(doneUntil)}>
          Add reminder to calendar
        </Button>
        <Button variant="outlined" startIcon={<ShareIcon />} onClick={onShare}>
          Share manage link
        </Button>
        <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
          <LockIcon fontSize="small" />
          <Typography variant="caption">
            The manage link is saved in this browser. Whoever has it can extend or deactivate.
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

  if (!activation) {
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
          <Chip label="ACTIVE" size="small" sx={{ bgcolor: activeColor, color: '#fff', fontWeight: 800 }} />
          <Typography variant="body2Bold">until {formatUntil(activation.until)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Activated {formatActivatedAgo(activation.activatedAt)}
          {activation.activatedBy ? ` by ${activation.activatedBy}` : ''}
          {code ? ' · you have the manage link' : ''}
        </Typography>
      </Box>
      {code && step === 'extend' && (
        <UntilPicker
          title="Extend until"
          confirmText={() => 'Extend'}
          after={activation.until}
          onCancel={() => setStep(undefined)}
          onConfirm={onExtend}
        />
      )}
      {code && step === 'confirmDeactivate' && (
        <>
          <Typography variant="body2">
            Deactivate? It disappears from the map and the manage link stops working.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" sx={{ bgcolor: activeColor }} onClick={onDeactivate}>
              Deactivate
            </Button>
          </Stack>
        </>
      )}
      {code && !step && (
        <>
          {expiresWithinADay(activation.until) && (
            <Alert severity="warning">
              Ends {formatUntil(activation.until)} and disappears from the map. Still up?
            </Alert>
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={() => setStep('extend')}>
              Extend
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: activeColor }}
              onClick={() => setStep('confirmDeactivate')}
            >
              Deactivate
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
