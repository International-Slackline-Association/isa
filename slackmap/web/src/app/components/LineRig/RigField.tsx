import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import ShareIcon from '@mui/icons-material/Share';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useConfirmDialog } from 'app/components/Dialogs/useConfirmDialog';
import { useSignInDialog } from 'app/components/Dialogs/useSignInDialog';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';
import { appColors } from 'styles/theme/colors';
import { showErrorNotification, showInfoNotification, showSuccessNotification } from 'utils';

import { NoPassError, consumeManageLinkFromUrl, endRig, extendRig, manageCodeOf, manageLinkOf, reportRig } from './rigApi';
import {
  calendarFile,
  dateInputBounds,
  expiresWithinADay,
  formatReportedAgo,
  formatUntil,
  untilFromDateInput,
  untilPresets,
} from './rigTimes';

export const rigColor = appColors.riggedColor;
const explainerSeenKey = 'app.rigExplainerSeen';

interface Props {
  lineId: string;
  lineName: string;
  rig?: { until: number; reportedAt: number };
  onChanged: () => void;
}

const UntilSheet = (props: {
  open: boolean;
  title: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: (until: number) => Promise<void>;
  // Extending offers only later dates than the rig already has.
  after?: number;
}) => {
  const presets = untilPresets().filter((p) => !props.after || p.until > props.after);
  const [until, setUntil] = useState(presets[0]?.until ?? 0);
  const [busy, setBusy] = useState(false);
  const bounds = dateInputBounds();

  return (
    <Drawer anchor="bottom" open={props.open} onClose={props.onClose}>
      <Stack spacing={2} sx={{ p: 2, maxWidth: 480, width: '100%', mx: 'auto' }}>
        <Typography variant="h6">{props.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          Rigged until
        </Typography>
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
          slotProps={{ inputLabel: { shrink: true }, htmlInput: bounds }}
          onChange={(e) => e.target.value && setUntil(untilFromDateInput(e.target.value))}
        />
        <Typography variant="body2" color="text.secondary">
          {until ? `Until ${formatUntil(until)}. It disappears from the map after that.` : 'Pick a date.'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" onClick={props.onClose}>
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
      </Stack>
    </Drawer>
  );
};

export const RigField = (props: Props) => {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const { SignInDialog, showSignInDialog } = useSignInDialog();
  const { ConfirmDialog, showConfirmDialog } = useConfirmDialog();

  const [code, setCode] = useState<string | undefined>();
  const [sheet, setSheet] = useState<'report' | 'extend' | undefined>();
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [doneUntil, setDoneUntil] = useState<number | undefined>();

  useEffect(() => {
    consumeManageLinkFromUrl(props.lineId);
    setCode(manageCodeOf(props.lineId));
  }, [props.lineId]);

  const rig = props.rig;
  const manageLink = code ? manageLinkOf(props.lineId, code) : undefined;

  const onReportClicked = () => {
    if (!isSignedIn) return showSignInDialog();
    let seen = false;
    try {
      seen = localStorage.getItem(explainerSeenKey) === 'true';
    } catch {}
    if (seen) setSheet('report');
    else setExplainerOpen(true);
  };

  const fail = (error: unknown) => {
    if (error instanceof NoPassError) {
      dispatch(
        showErrorNotification(
          'No pass to report with. Accept the contributor agreement, or wait for next month if you used this month’s passes.',
        ),
      );
    } else {
      dispatch(showErrorNotification((error as Error).message));
    }
  };

  const onReport = async (until: number) => {
    try {
      const result = await reportRig(props.lineId, until);
      setCode(manageCodeOf(props.lineId));
      setSheet(undefined);
      setDoneUntil(result.until);
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onExtend = async (until: number) => {
    if (!code) return;
    try {
      await extendRig(props.lineId, code, until);
      setSheet(undefined);
      dispatch(showSuccessNotification(`Extended until ${formatUntil(until)}`));
      props.onChanged();
    } catch (error) {
      fail(error);
    }
  };

  const onTakeDown = () =>
    showConfirmDialog({
      title: 'Mark as taken down?',
      description: 'It disappears from the map. The manage link stops working.',
      confirmText: 'Taken down',
      onConfirm: async () => {
        if (!code) return;
        try {
          await endRig(props.lineId, code);
          setCode(undefined);
          dispatch(showSuccessNotification('Marked as taken down'));
          props.onChanged();
        } catch (error) {
          fail(error);
        }
      },
    });

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

  return (
    <>
      <SignInDialog />
      <ConfirmDialog />

      {rig ? (
        <Box sx={{ borderRadius: 2, p: 1.5, bgcolor: '#fff3e6', border: '1px solid #ffcf99' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label="RIGGED" size="small" sx={{ bgcolor: rigColor, color: '#fff', fontWeight: 800 }} />
            <Typography variant="body2Bold">until {formatUntil(rig.until)}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Reported {formatReportedAgo(rig.reportedAt)}
            {code ? ' · you have the manage link' : ''}
          </Typography>
          {code && (
            <>
              {expiresWithinADay(rig.until) && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Expires {formatUntil(rig.until)} and disappears from the map. Still up?
                </Alert>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => setSheet('extend')}>
                  Extend
                </Button>
                <Button fullWidth variant="contained" sx={{ bgcolor: rigColor }} onClick={onTakeDown}>
                  Taken down
                </Button>
              </Stack>
              <Button size="small" startIcon={<ShareIcon />} sx={{ mt: 0.5 }} onClick={onShare}>
                Share manage link
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Button variant="contained" fullWidth onClick={onReportClicked}>
          {isSignedIn ? 'Report rigged' : 'Sign in to report rigged'}
        </Button>
      )}

      <Dialog open={explainerOpen} onClose={() => setExplainerOpen(false)}>
        <DialogTitle>Reporting is anonymous</DialogTitle>
        <DialogContent>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1 } }}>
            <li>
              <b>SlackMap cannot know it was you.</b> The report reaches us without your account.
            </li>
            <li>
              We only learn that <i>a</i> SlackMap member sent it, through an anonymous pass your browser got in
              advance.
            </li>
            <li>
              You get a <b>manage link</b>. Whoever has it can extend or take down this rig: keep it, or share it
              with your other devices or your crew.
            </li>
            <li>People nearby may still guess who rigs here. We can’t protect against that.</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              try {
                localStorage.setItem(explainerSeenKey, 'true');
              } catch {}
              setExplainerOpen(false);
              setSheet('report');
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <UntilSheet
        open={sheet === 'report'}
        title={`Report ${props.lineName} rigged`}
        confirmText="Report rigged"
        onClose={() => setSheet(undefined)}
        onConfirm={onReport}
      />
      <UntilSheet
        open={sheet === 'extend'}
        after={rig?.until}
        title="Extend until"
        confirmText="Extend"
        onClose={() => setSheet(undefined)}
        onConfirm={onExtend}
      />

      <Dialog open={doneUntil !== undefined} onClose={() => setDoneUntil(undefined)}>
        <DialogTitle>✓ Rigged until {doneUntil && formatUntil(doneUntil)}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              It shows on the map within a minute. Others see when it was reported, never who.
            </Typography>
            <Button variant="contained" startIcon={<EventIcon />} onClick={() => doneUntil && onCalendar(doneUntil)}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDoneUntil(undefined)}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
