import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, AvatarGroup, Box, Button, ButtonBase, Collapse, Stack, Typography } from '@mui/material';

import { activityApi } from 'app/api/activity-api';
import { getActivePoints, useMapDataVersion } from 'app/api/geojson-data';
import { lineApi } from 'app/api/line-api';
import { spotApi } from 'app/api/spot-api';
import { ChangelogActionIcon } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { formatUntil } from 'app/components/LineActivation/activationTimes';
import { appActions } from 'app/slices/app';
import { formatDistanceToNowStrict } from 'date-fns';
import ReactHtmlParser from 'html-react-parser';
import { ui } from 'styles/theme/ui';

import { PanelRow, SectionTitle, flagUrl } from './PanelRow';

type ActiveFeature = Awaited<ReturnType<typeof getActivePoints>>[number];

const useHighlight = () => {
  const dispatch = useDispatch();
  return (id?: string, type?: SlacklineMapFeatureType) =>
    dispatch(appActions.updateHighlightedFeature(id && type ? { id, type } : undefined));
};

const ActiveRow = (props: { feature: ActiveFeature; onOpen: () => void }) => {
  const isSpot = props.feature.type === 'spot';
  const line = lineApi.useGetLineDetailsQuery(props.feature.id, { skip: isSpot });
  const spot = spotApi.useGetSpotDetailsQuery(props.feature.id, { skip: !isSpot });
  const data = isSpot ? spot.data : line.data;
  const highlight = useHighlight();
  return (
    <PanelRow
      accent={ui.active}
      title={data ? data.name || 'No name' : '…'}
      subtitle={`${isSpot ? 'Spot, until' : 'until'} ${formatUntil(props.feature.activeUntil)}`}
      flag={props.feature.country}
      trailing={isSpot ? undefined : props.feature.length}
      onClick={props.onOpen}
      onHover={(on) => highlight(on ? props.feature.id : undefined, props.feature.type)}
    />
  );
};

export const ActiveNowSection = (props: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<ActiveFeature[]>();
  const dataVersion = useMapDataVersion('features');

  useEffect(() => {
    const load = () => getActivePoints().then(setFeatures);
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [dataVersion]);

  return (
    <Box>
      <SectionTitle title="Active now" count={features?.length} />
      {features?.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
          Nothing is active right now. Rigging? Open the line or spot on the map and tap Activate.
        </Typography>
      )}
      {features?.map((feature) => (
        <ActiveRow
          key={`${feature.type}:${feature.id}`}
          feature={feature}
          onOpen={() => {
            navigate(`/${feature.type}/${feature.id}`);
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
          variant="outlined"
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
          <Typography variant="caption" sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>
            Top contributors
          </Typography>
          <ExpandMoreIcon
            fontSize="small"
            sx={{ color: 'text.secondary', transform: open ? 'rotate(180deg)' : undefined }}
          />
        </Stack>
        {!open && (
          <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 11, borderColor: ui.blue } }}>
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
              <Avatar src={c.user.profilePictureUrl} sx={{ width: 24, height: 24, fontSize: 11 }}>
                {c.user.fullName.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
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
