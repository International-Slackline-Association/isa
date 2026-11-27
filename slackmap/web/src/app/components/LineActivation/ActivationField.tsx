import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LinkIcon from '@mui/icons-material/Link';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckIcon from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import SensorsIcon from '@mui/icons-material/Sensors';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Button, ButtonBase, Checkbox, Chip, FormControlLabel, Link, Stack, Typography } from '@mui/material';

import { meApi } from 'app/api/me-api';
import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { useResumeAfterSignIn } from 'app/signIn';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { format } from 'date-fns';
import { ui } from 'styles/theme/ui';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import { ActivateDialog, ActivationMode } from './ActivateDialog';
import { ActivationDatesField, PublicDates } from './ActivationDatesField';
import { DatesPicker } from './DatesPicker';
import {
  ActivationDate,
  ManageAuth,
  NoPassError,
  activateAnonymously,
  activateDatesWithName,
  activateWithName,
  consumeManageLinkFromUrl,
  deactivate,
  extendActivation,
  manageLinkFor,
  manageLinkOf,
  setRemind,
  ActivationTarget,
} from './activationApi';
import {
  Bound,
  atHour,
  dateInputBounds,
  formatActivatedAgo,
  formatStart,
  formatUntil,
  hourOf,
  maxActivationDays,
  nudgeToExtend,
  sameDay,
  startFromDateInput,
  startInputBounds,
  startPresets,
  untilFromDateInput,
  untilPresets,
} from './activationTimes';
import { hasPass, passQuota, refillSettled } from './passes';


interface Props {
  target: ActivationTarget;
  featureName: string;
  activation?: { from: number; until: number; activatedAt: number; activatedBy?: string; fromDates: boolean };
  activationDates?: PublicDates;
  onChanged: () => void;
}

// The choice happens in a pop-up; every step after it happens inside the card.
type Step = 'until' | 'done' | 'extend' | 'confirmDeactivate';

const Section = (props: { active?: boolean; children: React.ReactNode }) => (
  <Stack spacing={1.25} sx={{ borderRadius: '14px', p: 1.5, bgcolor: props.active ? ui.activeTint : ui.fill }}>
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

const chipSx = (selected: boolean, color: string, onColor: string) => ({
  fontWeight: 600,
  bgcolor: selected ? color : '#fff',
  color: selected ? onColor : 'text.primary',
  '&&:hover': { bgcolor: selected ? color : ui.fillHover },
});

const chipBoxSx = { display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, height: 32, borderRadius: 999, bgcolor: '#fff', color: 'text.secondary' };

const DateChip = (props: { bounds: { min: string; max: string }; onPick: (value: string) => void }) => (
  <Box component="label" sx={chipBoxSx}>
    <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
    <Box
      component="input"
      type="date"
      {...props.bounds}
      // iOS fills an empty date with today as the picker opens.
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value && value >= props.bounds.min && value <= props.bounds.max) props.onPick(value);
      }}
      sx={{ border: 0, font: 'inherit', fontSize: 13, color: 'text.primary', bgcolor: 'transparent', width: 120 }}
    />
  </Box>
);

const hours = Array.from({ length: 23 }, (_, i) => i + 1);

const HourChip = (props: {
  value: number;
  bound: Bound;
  min: number;
  max: number;
  emptyLabel: string;
  empty?: number;
  onPick: (value?: number) => void;
}) => {
  const hour = hourOf(props.value, props.bound);
  const offered = hours.filter((h) => {
    const at = atHour(props.value, props.bound, h);
    return h === hour || (at > props.min && at <= props.max);
  });
  return (
    <Box component="label" sx={chipBoxSx}>
      <ScheduleIcon sx={{ fontSize: 16 }} />
      <Box
        component="select"
        value={hour ?? ''}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          props.onPick(e.target.value === '' ? props.empty : atHour(props.value, props.bound, Number(e.target.value)))
        }
        sx={{ border: 0, font: 'inherit', fontSize: 13, color: 'text.primary', bgcolor: 'transparent' }}
      >
        <option value="">{props.emptyLabel}</option>
        {offered.map((h) => (
          <option key={h} value={h}>
            {`${String(h).padStart(2, '0')}:00`}
          </option>
        ))}
      </Box>
    </Box>
  );
};

const nowSeconds = () => Math.floor(Date.now() / 1000);
const daySeconds = 24 * 3600;

const keepHour = (day: number, current: number | undefined, bound: Bound, min: number, max: number) => {
  const hour = current === undefined ? undefined : hourOf(current, bound);
  const at = atHour(day, bound, hour);
  return at > min && at <= max ? at : day;
};

const StartChips = (props: { value?: number; onPick: (from?: number) => void }) => {
  const max = nowSeconds() + maxActivationDays * daySeconds;
  const today = atHour(nowSeconds(), 'start');
  const day = props.value ?? today;
  const onToday = sameDay(day, today);
  const pickDay = (day?: number) => props.onPick(day === undefined ? undefined : keepHour(day, props.value, 'start', 0, max));
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      {startPresets().map((p) => (
        <Chip key={p.label} label={p.label} onClick={() => pickDay(p.from)} sx={chipSx(p.from === undefined ? onToday : sameDay(props.value, p.from), ui.blue, ui.onBlue)} />
      ))}
      <DateChip bounds={startInputBounds()} onPick={(value) => pickDay(startFromDateInput(value))} />
      <HourChip
        value={day}
        bound="start"
        min={onToday ? nowSeconds() : 0}
        max={max}
        emptyLabel={onToday ? 'Now' : 'Start of day'}
        empty={onToday ? undefined : atHour(day, 'start')}
        onPick={props.onPick}
      />
    </Stack>
  );
};

const UntilChips = (props: { from?: number; after?: number; value?: number; onPick: (until: number) => void }) => {
  const presets = untilPresets(props.from).filter((p) => !props.after || p.until > props.after);
  const min = Math.max(nowSeconds(), props.from ?? 0, props.after ?? 0);
  const max = Math.max(props.from ?? 0, nowSeconds()) + maxActivationDays * daySeconds;
  const pickDay = (day: number) => props.onPick(keepHour(day, props.value, 'end', min, max));
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      {presets.map((p) => (
        <Chip key={p.label} label={p.label} onClick={() => pickDay(p.until)} sx={chipSx(sameDay(props.value, p.until), ui.active, ui.onActive)} />
      ))}
      <DateChip bounds={dateInputBounds(props.from, props.after)} onPick={(value) => pickDay(untilFromDateInput(value))} />
      {props.value !== undefined && (
        <HourChip value={props.value} bound="end" min={min} max={max} emptyLabel="End of day" empty={atHour(props.value, 'end')} onPick={(v) => v !== undefined && props.onPick(v)} />
      )}
    </Stack>
  );
};

const Tile = (props: { icon: React.ReactNode; title: string; line: string; onClick: () => void }) => (
  <ButtonBase
    onClick={props.onClick}
    sx={{ flex: 1, flexDirection: 'column', gap: 0.25, p: 1.25, borderRadius: '12px', bgcolor: '#fff', '&:hover': { bgcolor: ui.fill } }}
  >
    <Box sx={{ color: ui.activeInk, '& .MuiSvgIcon-root': { fontSize: 22 } }}>{props.icon}</Box>
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

  const [link, setLink] = useState<{ code: string; activatedAt: number }>();
  const [several, setSeveral] = useState(false);
  const [pickedDates, setPickedDates] = useState<ActivationDate[]>([]);
  const [remind, setRemindChoice] = useState(true);
  const [doneDates, setDoneDates] = useState<number>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ActivationMode>('anonymous');
  const [step, setStep] = useState<Step>();
  const [from, setFrom] = useState<number>();
  const [until, setUntil] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [doneUntil, setDoneUntil] = useState<number>();
  const [doneFrom, setDoneFrom] = useState<number>();
  const [extendUntil, setExtendUntil] = useState<number>();

  useEffect(() => {
    consumeManageLinkFromUrl(props.target);
    setLink(manageLinkFor(props.target, props.activation, props.activationDates));
  }, [props.target.type, props.target.id, props.activation?.activatedAt, props.activationDates?.activatedAt]);

  const { data: mine, refetch: refetchMine } = meApi.useGetMyActivationsQuery(undefined, { skip: !isSignedIn });
  const ownOf = (kind: 'once' | 'dates') =>
    mine?.activations.find((a) => a.kind === kind && a.featureType === props.target.type && a.featureId === props.target.id);
  const ownOnce = ownOf('once');
  const ownDates = ownOf('dates');

  useEffect(() => {
    setStep(undefined);
    setExtendUntil(undefined);
  }, [props.target.type, props.target.id]);

  const activation = props.activation;
  const dates = props.activationDates;
  const fromDates = Boolean(activation?.fromDates);
  const activationAuth: ManageAuth | undefined =
    activation && link?.activatedAt === activation.activatedAt
      ? { code: link.code }
      : activation && (ownOnce || (ownDates && fromDates))
        ? 'owner'
        : undefined;
  const code = activationAuth && activationAuth !== 'owner' ? activationAuth.code : undefined;
  const manageLink = link ? manageLinkOf(props.target, link) : undefined;
  // Never a signed-in call right after an anonymous action: the two would be one moment in the logs.
  const changed = (named: boolean) => {
    props.onChanged();
    if (named && isSignedIn) refetchMine();
  };
  const isNamed = Boolean(activation?.activatedBy);

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
    setSeveral(false);
    setRemindChoice(true);
    setDialogOpen(false);
    setFrom(undefined);
    setUntil(untilPresets()[0].until);
    setStep('until');
  };

  const onActivate = () =>
    run(async () => {
      if (mode === 'named' && several) {
        const result = await activateDatesWithName(props.target, pickedDates, remind);
        setLink(manageLinkFor(props.target, result));
        setDoneDates(result.dates.length);
        setDoneFrom(result.dates[0].from);
        setDoneUntil(result.dates[0].until);
        setStep('done');
        return;
      }
      if (!until) return;
      const result =
        mode === 'named'
          ? await activateWithName(props.target, until, from, remind)
          : await activateAnonymously(props.target, until, from);
      setLink(manageLinkFor(props.target, result));
      setDoneDates(undefined);
      setDoneFrom(result.from);
      setDoneUntil(result.until);
      // The card reloads on onChanged and would drop this step, so it reloads when the step is closed.
      setStep('done');
    });

  const onExtend = (newUntil: number) =>
    run(async () => {
      if (!activationAuth) return;
      await extendActivation(props.target, activationAuth, newUntil);
      setStep(undefined);
      setExtendUntil(undefined);
      dispatch(showSuccessNotification(`Extended until ${formatUntil(newUntil)}`));
      changed(isNamed);
    });

  const onDeactivate = () =>
    run(async () => {
      if (!activationAuth) return;
      await deactivate(props.target, activationAuth);
      setStep(undefined);
      dispatch(showSuccessNotification(fromDates ? 'Deactivated for this date' : 'Deactivated'));
      changed(isNamed);
    });

  const onShare = async () => {
    if (!manageLink) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SlackMap manage link', text: `Manage ${props.featureName} on SlackMap`, url: manageLink });
        return;
      }
      await navigator.clipboard.writeText(manageLink);
      dispatch(showInfoNotification('Manage link copied'));
    } catch {}
  };

  const dialog = (
    <ActivateDialog
      open={dialogOpen}
      featureName={props.featureName}
      anonymousUnavailable={hasPass() ? undefined : noPassReason()}
      onClose={() => setDialogOpen(false)}
      onChoose={onChoose}
    />
  );

  const datesField = (
    <ActivationDatesField
      target={props.target}
      dates={dates}
      link={link}
      own={ownDates}
      showNext={!fromDates}
      onChanged={() => changed(true)}
    />
  );

  if (step === 'until' && !activation) {
    return (
      <>
        {dialog}
        <Section>
          <ModePill mode={mode} onChange={() => setDialogOpen(true)} />
          {mode === 'named' && !dates && (
            <Stack direction="row" sx={{ gap: 0.75 }}>
              <Chip label="Once" onClick={() => setSeveral(false)} sx={chipSx(!several, ui.blue, ui.onBlue)} />
              <Chip label="Several dates" onClick={() => setSeveral(true)} sx={chipSx(several, ui.blue, ui.onBlue)} />
            </Stack>
          )}
          {mode === 'named' && several ? (
            <>
              <Typography variant="subtitle1">Which dates?</Typography>
              <DatesPicker onChange={setPickedDates} />
              <Typography variant="body2" color="text.secondary">
                {pickedDates.length
                  ? `${pickedDates.length} date${pickedDates.length > 1 ? 's' : ''}, first ${formatStart(pickedDates[0].from)}. Your name and dates show on the ${props.target.type}.`
                  : 'Tap the days you meet there, up to 3 months ahead.'}
              </Typography>
            </>
          ) : (
            <>
          <Typography variant="subtitle1">Starts</Typography>
          <StartChips
            value={from}
            onPick={(picked) => {
              setFrom(picked);
              const now = Date.now() / 1000;
              const fits = until !== undefined && until > (picked ?? now) && until <= Math.max(picked ?? 0, now) + maxActivationDays * daySeconds;
              if (!fits) setUntil(untilPresets(picked)[0].until);
            }}
          />
          <Typography variant="subtitle1">Up until when?</Typography>
          <UntilChips from={from} value={until} onPick={setUntil} />
          <Typography variant="body2" color="text.secondary">
            {until
              ? `${from ? `On the map from ${formatStart(from)}, gone` : 'Gone from the map'} after ${formatUntil(until)}.`
              : 'Pick a day and, if you like, a time, up to 14 days.'}
          </Typography>
            </>
          )}
          {mode === 'named' && (
            <FormControlLabel
              control={<Checkbox size="small" checked={remind} onChange={(e) => setRemindChoice(e.target.checked)} />}
              label={<Typography variant="body2">{several ? 'Email me before my last date' : 'Email me before it ends'}</Typography>}
            />
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="active"
              startIcon={<SensorsIcon />}
              disabled={busy || (mode === 'named' && several ? pickedDates.length === 0 : !until)}
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
      <Section active>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: ui.active, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <CheckIcon sx={{ color: ui.onActive }} />
          </Box>
          <Box>
            <Typography variant="h5">
              {doneDates
                ? `${doneDates} date${doneDates > 1 ? 's' : ''} set, first ${formatStart(doneFrom!)}`
                : doneFrom && doneFrom > Date.now() / 1000
                ? `Starts ${formatStart(doneFrom)}, until ${formatUntil(doneUntil)}`
                : `Active until ${formatUntil(doneUntil)}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {doneDates ? 'Each date is on the map when it starts' : doneFrom && doneFrom > Date.now() / 1000 ? 'On the map when it starts' : 'On the map within a minute'}
              {mode === 'named' ? ', with your name' : ', anonymously'}.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
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
            changed(mode === 'named');
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
        {datesField}
        <Stack spacing={0.5}>
          <Button variant="contained" color="active" fullWidth startIcon={<SensorsIcon />} onClick={onActivateClicked}>
            Activate
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Rigged right now? Let others know, safely.
          </Typography>
        </Stack>
      </>
    );
  }

  const scheduled = activation.from > Date.now() / 1000;

  return (
    <>
    <Section active>
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {scheduled ? (
            <Chip label="Scheduled" size="small" sx={{ bgcolor: ui.blue, color: ui.onBlue, fontWeight: 600 }} />
          ) : (
            <Chip label="Active" size="small" color="active" />
          )}
          <Typography variant="body2Bold">
            {scheduled ? `from ${formatStart(activation.from)} until ${formatUntil(activation.until)}` : `until ${formatUntil(activation.until)}`}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Activated {formatActivatedAgo(activation.activatedAt)}
          {activation.activatedBy ? ` by ${activation.activatedBy}` : ''}
          {code ? ' · you have the manage link' : activationAuth ? ' · you activated it' : ''}
        </Typography>
      </Box>
      {activationAuth && step === 'extend' && (
        <>
          <Typography variant="subtitle1">Extend until?</Typography>
          <UntilChips
            from={scheduled ? activation.from : undefined}
            after={activation.until}
            value={extendUntil}
            onPick={setExtendUntil}
          />
          <Typography variant="body2" color="text.secondary">
            {extendUntil ? `Gone from the map after ${formatUntil(extendUntil)}.` : 'Pick a later day or time.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ bgcolor: '#fff' }}
              onClick={() => {
                setStep(undefined);
                setExtendUntil(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="active"
              disabled={busy || !extendUntil}
              onClick={() => extendUntil && onExtend(extendUntil)}
            >
              Extend
            </Button>
          </Stack>
        </>
      )}
      {activationAuth && step === 'confirmDeactivate' && (
        <>
          <Typography variant="subtitle1">{fromDates ? 'Deactivate for this date?' : 'Deactivate?'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {fromDates ? 'Your other dates stay.' : code ? 'The manage link stops working.' : 'It is gone from the map.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep(undefined)}>
              Keep
            </Button>
            <Button fullWidth variant="contained" color="active" disabled={busy} onClick={onDeactivate}>
              Deactivate
            </Button>
          </Stack>
        </>
      )}
      {activationAuth && !step && (
        <>
          {nudgeToExtend(activation.from, activation.until) && (
            <Typography variant="body2" sx={{ color: ui.activeInk, fontWeight: 500 }}>
              Ends {formatUntil(activation.until)}. Still up?
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('extend')}>
              Extend
            </Button>
            <Button fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} onClick={() => setStep('confirmDeactivate')}>
              Deactivate
            </Button>
          </Stack>
          {ownOnce && !fromDates && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={ownOnce.remind}
                  onChange={(e) => run(async () => {
                    await setRemind(props.target, 'once', e.target.checked);
                    refetchMine();
                  })}
                />
              }
              label={<Typography variant="body2">Email me before it ends</Typography>}
            />
          )}
          {manageLink && (
            <Button size="small" startIcon={<ShareIcon />} sx={{ alignSelf: 'flex-start' }} onClick={onShare}>
              Share manage link
            </Button>
          )}
        </>
      )}
    </Section>
    {datesField}
    </>
  );
};
