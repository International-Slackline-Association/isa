import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckIcon from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import SensorsIcon from '@mui/icons-material/Sensors';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Button, ButtonBase, Chip, Link, Stack, Typography } from '@mui/material';

import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { useResumeAfterSignIn } from 'app/signIn';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { format } from 'date-fns';
import { ui } from 'styles/theme/ui';
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
import { hasPass, passQuota, refillSettled } from './passes';


interface Props {
  lineId: string;
  lineName: string;
  activation?: { until: number; activatedAt: number; activatedBy?: string };
  onChanged: () => void;
}

// The choice happens in a pop-up; every step after it happens inside the card.
type Step = 'until' | 'done' | 'extend' | 'confirmDeactivate';

const Section = (props: { live?: boolean; children: React.ReactNode }) => (
  <Stack spacing={1.25} sx={{ borderRadius: '14px', p: 1.5, bgcolor: props.live ? ui.liveTint : ui.fill }}>
    {props.children}
  </Stack>
);

const ModePill = (props: { mode: ActivationMode; onChange: () => void }) => (
  <Stack direction="row" sx={{ alignItems: 'center' }}>
    <Chip
      size="small"
      icon={props.mode === 'named' ? <BadgeOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
      label={props.mode === 'named' ? 'With my name' : 'Anonymous'}
      sx={{ bgcolor: '#fff', fontWeight: 600, '& .MuiChip-icon': { fontSize: 16, ml: 0.75 } }}
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
            bgcolor: props.value === p.until ? ui.live : '#fff',
            color: props.value === p.until ? ui.onLive : 'text.primary',
            '&&:hover': { bgcolor: props.value === p.until ? ui.live : ui.fillHover },
          }}
        />
      ))}
      <Box
        component="label"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, height: 32, borderRadius: 999, bgcolor: '#fff', color: 'text.secondary' }}
      >
        <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
        <Box
          component="input"
          type="date"
          {...dateInputBounds()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.value && props.onPick(untilFromDateInput(e.target.value))}
          sx={{ border: 0, font: 'inherit', fontSize: 13, color: 'text.primary', bgcolor: 'transparent', width: 120 }}
        />
      </Box>
    </Stack>
  );
};

const Tile = (props: { icon: React.ReactNode; title: string; line: string; onClick: () => void }) => (
  <ButtonBase
    onClick={props.onClick}
    sx={{ flex: 1, flexDirection: 'column', gap: 0.25, p: 1.25, borderRadius: '12px', bgcolor: '#fff', '&:hover': { bgcolor: ui.fill } }}
  >
    <Box sx={{ color: ui.liveInk, '& .MuiSvgIcon-root': { fontSize: 22 } }}>{props.icon}</Box>
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

  // A first sign-in on this device is still fetching passes; opening before they land would show
  // anonymous as unavailable.
  useResumeAfterSignIn('activate', () => refillSettled().then(() => setDialogOpen(true)));

  const onActivateClicked = () => {
    if (!isSignedIn) return showSignInDialog({ resume: 'activate' });
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
          <Typography variant="subtitle1">Up until when?</Typography>
          <UntilChips value={until} onPick={setUntil} />
          <Typography variant="body2" color="text.secondary">
            {until ? `Gone from the map after ${formatUntil(until)}.` : 'Pick a day, up to 14 days.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="live"
              startIcon={<SensorsIcon />}
              disabled={busy || !until}
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
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: ui.live, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <CheckIcon sx={{ color: ui.onLive }} />
          </Box>
          <Box>
            <Typography variant="h5">Active until {formatUntil(doneUntil)}</Typography>
            <Typography variant="body2" color="text.secondary">
              On the map within a minute{mode === 'named' ? ', with your name' : ', anonymously'}.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tile icon={<EventOutlinedIcon />} title="Remind me" line="add to calendar" onClick={() => onCalendar(doneUntil)} />
          <Tile icon={<LinkIcon />} title="Share link" line="other phone or crew" onClick={onShare} />
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <LockIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">This browser keeps the manage link.</Typography>
        </Stack>
        <Button
          variant="contained"
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
          <Button variant="contained" color="live" fullWidth startIcon={<SensorsIcon />} onClick={onActivateClicked}>
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
          <Chip label="Active" size="small" color="live" />
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
          <Typography variant="subtitle1">Extend until?</Typography>
          <UntilChips after={activation.until} onPick={onExtend} />
          <Button variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
            Cancel
          </Button>
        </>
      )}
      {code && step === 'confirmDeactivate' && (
        <>
          <Typography variant="subtitle1">Take it off the map?</Typography>
          <Typography variant="body2" color="text.secondary">
            The manage link stops working.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Keep
            </Button>
            <Button fullWidth variant="contained" color="live" disabled={busy} onClick={onDeactivate}>
              Deactivate
            </Button>
          </Stack>
        </>
      )}
      {code && !step && (
        <>
          {expiresWithinADay(activation.until) && (
            <Typography variant="body2" sx={{ color: ui.liveInk, fontWeight: 500 }}>
              Ends {formatUntil(activation.until)}. Still up?
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('extend')}>
              Extend
            </Button>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('confirmDeactivate')}>
              Take it off
            </Button>
          </Stack>
          <Button size="small" startIcon={<ShareIcon />} sx={{ alignSelf: 'flex-start' }} onClick={onShare}>
            Share manage link
          </Button>
        </>
      )}
    </Section>
  );
};
