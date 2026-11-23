import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import CheckIcon from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import SensorsIcon from '@mui/icons-material/Sensors';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Button, ButtonBase, Chip, Link, Stack, Typography } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { format } from 'date-fns';
import { appColors } from 'styles/theme/colors';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import { ActivateDialog, ActivationMode } from './ActivateDialog';
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
import { hasPass, passQuota } from './passes';

const orange = appColors.activeColor;

interface Props {
  lineId: string;
  lineName: string;
  activation?: { until: number; activatedAt: number; activatedBy?: string };
  onChanged: () => void;
}

// The choice happens in a pop-up; every step after it happens inside the card.
type Step = 'until' | 'done' | 'extend' | 'confirmDeactivate';

const Section = (props: { live?: boolean; children: React.ReactNode }) => (
  <Stack
    spacing={1.25}
    sx={{
      borderRadius: 3.5,
      p: 1.5,
      bgcolor: props.live ? '#fff4e6' : '#f5f7f9',
      border: props.live ? '1px solid #ffd3a1' : 'none',
    }}
  >
    {props.children}
  </Stack>
);

const pill = { borderRadius: 999, textTransform: 'none', fontWeight: 700, boxShadow: 'none' } as const;

const ModePill = (props: { mode: ActivationMode; onChange: () => void }) => (
  <Stack direction="row" sx={{ alignItems: 'center' }}>
    <Chip
      size="small"
      label={props.mode === 'named' ? '🏷️ With my name' : '🕶️ Anonymous'}
      sx={{ bgcolor: '#fff', border: '1px solid #e4e7eb', fontWeight: 600 }}
    />
    <Link component="button" variant="body2" onClick={props.onChange} sx={{ ml: 'auto', fontWeight: 600 }}>
      change
    </Link>
  </Stack>
);

const UntilChips = (props: { after?: number; value?: number; onPick: (until: number) => void }) => {
  const presets = untilPresets().filter((p) => !props.after || p.until > props.after);
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      {presets.map((p) => (
        <Chip
          key={p.label}
          label={p.label}
          onClick={() => props.onPick(p.until)}
          sx={{
            fontWeight: 600,
            border: '1.5px solid',
            borderColor: props.value === p.until ? orange : '#d3d8de',
            bgcolor: props.value === p.until ? orange : '#fff',
            color: props.value === p.until ? '#fff' : 'text.primary',
            '&:hover': { bgcolor: props.value === p.until ? orange : '#f5f7f9' },
          }}
        />
      ))}
      <Box
        component="label"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, borderRadius: 999, border: '1.5px solid #d3d8de', bgcolor: '#fff' }}
      >
        📅
        <Box
          component="input"
          type="date"
          {...dateInputBounds()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.value && props.onPick(untilFromDateInput(e.target.value))}
          sx={{ border: 0, font: 'inherit', bgcolor: 'transparent', width: 120 }}
        />
      </Box>
    </Stack>
  );
};

const Tile = (props: { emoji: string; title: string; line: string; onClick: () => void }) => (
  <ButtonBase
    onClick={props.onClick}
    sx={{ flex: 1, flexDirection: 'column', gap: 0.25, p: 1.25, borderRadius: 3.5, border: '1.5px solid #ffd3a1', bgcolor: '#fff' }}
  >
    <Typography sx={{ fontSize: 24 }}>{props.emoji}</Typography>
    <Typography variant="body2Bold">{props.title}</Typography>
    <Typography variant="caption" color="text.secondary">
      {props.line}
    </Typography>
  </ButtonBase>
);

const nextMonthName = () => {
  const d = new Date();
  return format(new Date(d.getFullYear(), d.getMonth() + 1, 1), 'MMMM');
};

const noPassReason = () => {
  const quota = passQuota();
  const more = `more on 1 ${nextMonthName()}`;
  if (quota && quota.used >= quota.limit) return `Used ${quota.used}/${quota.limit} this month · ${more}`;
  if (quota) return `Used ${quota.used}/${quota.limit} this month, on your other devices`;
  return `No pass on this device yet · ${more}`;
};

export const ActivationField = (props: Props) => {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();

  const [code, setCode] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ActivationMode>('anonymous');
  const [step, setStep] = useState<Step>();
  const [until, setUntil] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [doneUntil, setDoneUntil] = useState<number>();

  useEffect(() => {
    consumeManageLinkFromUrl(props.lineId);
    setCode(manageCodeFor(props.lineId, props.activation));
  }, [props.lineId, props.activation?.activatedAt]);

  useEffect(() => setStep(undefined), [props.lineId]);

  const activation = props.activation;
  const manageLink = code ? manageLinkOf(props.lineId, code) : undefined;

  const fail = (error: unknown) => {
    const message =
      error instanceof NoPassError
        ? `${noPassReason()}. You can still activate with your name.`
        : (error as Error).message;
    dispatch(showErrorNotification(message));
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const onActivateClicked = () => {
    if (!isSignedIn) return showSignInDialog();
    setDialogOpen(true);
  };

  const onChoose = (chosen: ActivationMode) => {
    setMode(chosen);
    setDialogOpen(false);
    setUntil(untilPresets()[0].until);
    setStep('until');
  };

  const onActivate = () =>
    run(async () => {
      if (!until) return;
      const result =
        mode === 'named' ? await activateWithName(props.lineId, until) : await activateAnonymously(props.lineId, until);
      setCode(manageCodeFor(props.lineId, result));
      setDoneUntil(result.until);
      // The card reloads on onChanged and would drop this step, so it reloads when the step is closed.
      setStep('done');
    });

  const onExtend = (newUntil: number) =>
    run(async () => {
      if (!code) return;
      await extendActivation(props.lineId, code, newUntil);
      setStep(undefined);
      dispatch(showSuccessNotification(`Extended until ${formatUntil(newUntil)}`));
      props.onChanged();
    });

  const onDeactivate = () =>
    run(async () => {
      if (!code) return;
      await deactivate(props.lineId, code);
      setCode(undefined);
      setStep(undefined);
      dispatch(showSuccessNotification('Deactivated'));
      props.onChanged();
    });

  const onShare = async () => {
    if (!manageLink) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SlackMap manage link', text: `Manage ${props.lineName} on SlackMap`, url: manageLink });
        return;
      }
      await navigator.clipboard.writeText(manageLink);
      dispatch(showInfoNotification('Manage link copied'));
    } catch {}
  };

  const onCalendar = (forUntil: number) => {
    if (!manageLink) return;
    const url = URL.createObjectURL(calendarFile(props.lineName, forUntil, manageLink));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slackmap-activation-reminder.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const dialog = (
    <ActivateDialog
      open={dialogOpen}
      lineName={props.lineName}
      anonymousUnavailable={hasPass() ? undefined : noPassReason()}
      onClose={() => setDialogOpen(false)}
      onChoose={onChoose}
    />
  );

  if (step === 'until' && !activation) {
    return (
      <>
        {dialog}
        <Section>
          <ModePill mode={mode} onChange={() => setDialogOpen(true)} />
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Up until when?</Typography>
          <UntilChips value={until} onPick={setUntil} />
          <Typography variant="body2" color="text.secondary">
            {until ? `Gone from the map after ${formatUntil(until)}.` : 'Pick a day, up to 14 days.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={pill} onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SensorsIcon />}
              disabled={busy || !until}
              sx={{ ...pill, bgcolor: orange, '&:hover': { bgcolor: orange } }}
              onClick={onActivate}
            >
              Activate
            </Button>
          </Stack>
        </Section>
      </>
    );
  }

  if (step === 'done' && doneUntil) {
    return (
      <Section live>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: orange, display: 'grid', placeItems: 'center' }}>
            <CheckIcon sx={{ color: '#fff' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>Active until {formatUntil(doneUntil)}</Typography>
            <Typography variant="body2" color="text.secondary">
              On the map within a minute{mode === 'named' ? ', with your name' : ', anonymously'}.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tile emoji="📅" title="Remind me" line="add to calendar" onClick={() => onCalendar(doneUntil)} />
          <Tile emoji="🔗" title="Share link" line="other phone or crew" onClick={onShare} />
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <LockIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">This browser keeps the manage link.</Typography>
        </Stack>
        <Button
          variant="contained"
          sx={pill}
          onClick={() => {
            setStep(undefined);
            props.onChanged();
          }}
        >
          Done
        </Button>
      </Section>
    );
  }

  if (!activation) {
    return (
      <>
        <SignInDialog />
        {dialog}
        <Stack spacing={0.5}>
          <Button variant="contained" fullWidth startIcon={<SensorsIcon />} sx={pill} onClick={onActivateClicked}>
            Activate
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Rigged right now? Let others know, safely.
          </Typography>
        </Stack>
      </>
    );
  }

  return (
    <Section live>
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip label="● ACTIVE" size="small" sx={{ bgcolor: orange, color: '#fff', fontWeight: 800 }} />
          <Typography variant="body2Bold">until {formatUntil(activation.until)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Activated {formatActivatedAgo(activation.activatedAt)}
          {activation.activatedBy ? ` by ${activation.activatedBy}` : ''}
          {code ? ' · you have the manage link' : ''}
        </Typography>
      </Box>
      {code && step === 'extend' && (
        <>
          <Typography sx={{ fontWeight: 700 }}>Extend until?</Typography>
          <UntilChips after={activation.until} onPick={onExtend} />
          <Button variant="outlined" sx={pill} onClick={() => setStep(undefined)}>
            Cancel
          </Button>
        </>
      )}
      {code && step === 'confirmDeactivate' && (
        <>
          <Typography sx={{ fontWeight: 700 }}>Take it off the map?</Typography>
          <Typography variant="body2" color="text.secondary">
            The manage link stops working.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={pill} onClick={() => setStep(undefined)}>
              Keep
            </Button>
            <Button
              fullWidth
              variant="contained"
              disabled={busy}
              sx={{ ...pill, bgcolor: orange, '&:hover': { bgcolor: orange } }}
              onClick={onDeactivate}
            >
              Deactivate
            </Button>
          </Stack>
        </>
      )}
      {code && !step && (
        <>
          {expiresWithinADay(activation.until) && (
            <Typography variant="body2" sx={{ color: '#b26a00' }}>
              Ends {formatUntil(activation.until)}. Still up?
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={pill} onClick={() => setStep('extend')}>
              ⏩ Extend
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{ ...pill, bgcolor: orange, '&:hover': { bgcolor: orange } }}
              onClick={() => setStep('confirmDeactivate')}
            >
              ⏹ Deactivate
            </Button>
          </Stack>
          <Button size="small" startIcon={<ShareIcon />} sx={{ alignSelf: 'flex-start', textTransform: 'none' }} onClick={onShare}>
            Share manage link
          </Button>
        </>
      )}
    </Section>
  );
};
