import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, AvatarGroup, Box, Button, ButtonBase, Collapse, Stack, Typography } from '@mui/material';

import { activityApi } from 'app/api/activity-api';
import { getActiveLinePoints } from 'app/api/geojson-data';
import { lineApi } from 'app/api/line-api';
import { ChangelogActionIcon } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { formatUntil } from 'app/components/LineActivation/activationTimes';
import { appActions } from 'app/slices/app';
import { formatDistanceToNowStrict } from 'date-fns';
import ReactHtmlParser from 'html-react-parser';
import { appColors } from 'styles/theme/colors';

import { PanelRow, SectionTitle, flagUrl } from './PanelRow';

type ActiveLine = Awaited<ReturnType<typeof getActiveLinePoints>>[number];

const useHighlight = () => {
  const dispatch = useDispatch();
  return (id?: string, type?: SlacklineMapFeatureType) =>
    dispatch(appActions.updateHighlightedFeature(id && type ? { id, type } : undefined));
};

const ActiveLineRow = (props: { line: ActiveLine; onOpen: () => void }) => {
  const { data } = lineApi.useGetLineDetailsQuery(props.line.id);
  const highlight = useHighlight();
  return (
    <PanelRow
      accent={appColors.activeColor}
      title={data ? data.name || 'No name' : '…'}
      subtitle={`until ${formatUntil(props.line.activeUntil)}`}
      flag={props.line.country}
      trailing={props.line.length}
      onClick={props.onOpen}
      onHover={(on) => highlight(on ? props.line.id : undefined, 'line')}
    />
  );
};

export const ActiveNowSection = (props: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<ActiveLine[]>();

  useEffect(() => {
    const load = () => getActiveLinePoints().then(setLines);
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <SectionTitle title="Active now" count={lines?.length} />
      {lines?.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
          No line is active right now. Rigging one? Open it on the map and tap Activate.
        </Typography>
      )}
      {lines?.map((line) => (
        <ActiveLineRow
          key={line.id}
          line={line}
          onOpen={() => {
            navigate(`/line/${line.id}`);
            props.onNavigate?.();
          }}
        />
      ))}
    </Box>
  );
};

export const LatestChangesSection = (props: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const highlight = useHighlight();
  const [cursor, setCursor] = useState<string>();
  const { data: changelogs, isFetching } = activityApi.useGetActivityChangelogsQuery({ cursor });

  return (
    <Box>
      <SectionTitle title="Latest changes" />
      {changelogs?.items.map((changelog) => (
        <PanelRow
          key={changelog.date}
          icon={<ChangelogActionIcon type={changelog.actionType} />}
          title={<span>{ReactHtmlParser(changelog.htmlText)}</span>}
          subtitle={formatDistanceToNowStrict(new Date(changelog.date), { addSuffix: true })}
          multiline
          onClick={() => {
            navigate(
              changelog.featureType === 'group'
                ? `/communities/group/${changelog.featureId}`
                : `/${changelog.featureType}/${changelog.featureId}`,
            );
            props.onNavigate?.();
          }}
          onHover={(on) =>
            highlight(on ? changelog.featureId : undefined, changelog.featureType as SlacklineMapFeatureType)
          }
        />
      ))}
      {changelogs?.pagination?.cursor && (
        <Button
          size="small"
          disabled={isFetching}
          onClick={() => setCursor(changelogs.pagination.cursor)}
          sx={{ mt: 0.5 }}
        >
          Show more
        </Button>
      )}
    </Box>
  );
};

export const TopContributorsStrip = () => {
  const [open, setOpen] = useState(false);
  const { data: contributors } = activityApi.useGetGlobalContributorsQuery();
  if (!contributors?.items.length) return null;

  return (
    <Box>
      <ButtonBase
        onClick={() => setOpen(!open)}
        sx={{ width: '100%', justifyContent: 'space-between', borderRadius: 1, py: 0.5 }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Top contributors
          </Typography>
          <ExpandMoreIcon
            fontSize="small"
            sx={{ color: 'text.secondary', transform: open ? 'rotate(180deg)' : undefined }}
          />
        </Stack>
        {!open && (
          <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
            {contributors.items.slice(0, 6).map((c) => (
              <Avatar key={c.user.fullName} src={c.user.profilePictureUrl} alt={c.user.fullName}>
                {c.user.fullName.charAt(0)}
              </Avatar>
            ))}
          </AvatarGroup>
        )}
      </ButtonBase>
      <Collapse in={open}>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Most lines, spots and guides created or updated in the last 12 months.
        </Typography>
        <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {contributors.items.slice(0, 20).map((c, i) => (
            <Stack
              key={c.user.fullName}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="caption" sx={{ width: 16, color: 'text.secondary' }}>
                {i + 1}
              </Typography>
              <Avatar src={c.user.profilePictureUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                {c.user.fullName.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {c.user.fullName}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {c.user.countryCode && (
                    <Avatar src={flagUrl(c.user.countryCode)} sx={{ width: 12, height: 12, bgcolor: 'transparent' }} />
                  )}
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {c.added} created · {c.updated} updated
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
