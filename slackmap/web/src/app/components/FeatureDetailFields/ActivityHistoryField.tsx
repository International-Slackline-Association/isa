import React from 'react';

import HistoryIcon from '@mui/icons-material/History';
import Button from '@mui/material/Button';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Box, Chip, FormControlLabel, Link, Stack, Switch, Typography } from '@mui/material';

import { activityApi } from 'app/api/activity-api';
import { format } from 'date-fns';
import ReactHtmlParser from 'html-react-parser';

import { LoadingIndicator } from '../LoadingIndicator';
import { FeatureDetailFieldLayout } from './DetailFieldLayout';
import { ChangelogActionIcon } from './FeatureHistoryField';

interface Props {
  onChangelogClick: (featureId: string, featureType: SlacklineMapFeatureType) => void;
  onChangelogHover: (featureId?: string, featureType?: SlacklineMapFeatureType) => void;
}

const typeFilters = [
  { label: 'All', type: undefined },
  { label: 'Lines', type: 'line' },
  { label: 'Spots', type: 'spot' },
  { label: 'Guides', type: 'guide' },
  { label: 'Groups', type: 'group' },
];

export const ActivityHistoryField = (props: Props) => {
  const [cursor, setCursor] = React.useState<string>();
  const [type, setType] = React.useState<string>();
  const [createdOnly, setCreatedOnly] = React.useState(false);

  const { data: changelogs, isFetching } = activityApi.useGetActivityChangelogsQuery({
    cursor,
    type,
    createdOnly,
  });

  const changeFilter = (next: { type?: string; createdOnly?: boolean }) => {
    setCursor(undefined);
    if ('type' in next) setType(next.type);
    if (next.createdOnly !== undefined) setCreatedOnly(next.createdOnly);
  };

  const filters = (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', alignItems: 'center', rowGap: 0.5 }}>
      {typeFilters.map((f) => (
        <Chip
          key={f.label}
          label={f.label}
          size="small"
          color={type === f.type ? 'primary' : 'default'}
          onClick={() => changeFilter({ type: f.type })}
        />
      ))}
      <FormControlLabel
        sx={{ ml: 1 }}
        control={
          <Switch
            size="small"
            checked={createdOnly}
            onChange={(e) => changeFilter({ createdOnly: e.target.checked })}
          />
        }
        label={<Typography variant="body2">New only</Typography>}
      />
    </Stack>
  );

  const onChangelogClick = (featureId: string, featureType: SlacklineMapFeatureType) => {
    props.onChangelogClick(featureId, featureType);
  };

  const onChangelogHover = (featureId?: string, featureType?: SlacklineMapFeatureType) => {
    props.onChangelogHover(featureId, featureType);
  };

  return (
    <FeatureDetailFieldLayout icon={<HistoryIcon />} header={'Global History'} noDivider>
      {filters}
      {!changelogs ? (
        isFetching ? (
          <LoadingIndicator />
        ) : null
      ) : (
        <Box>
          <Timeline
            sx={{
              p: 0,
              m: 0,
              '& .MuiTimelineItem-missingOppositeContent:before': {
                display: 'none',
              },
            }}
          >
            {changelogs.items.map((changelog, index) => (
              <TimelineItem key={changelog.date}>
                <TimelineSeparator>
                  {index !== 0 && <TimelineConnector />}
                  <TimelineDot color="primary">
                    <ChangelogActionIcon type={changelog.actionType} />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{}}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8rem',
                      color: (t) => t.palette.text.secondary,
                    }}
                  >
                    {format(new Date(changelog.date), 'dd MMM yyy, HH:mm')}
                  </Typography>
                  <Link
                    component="button"
                    variant="body2"
                    color="text.primary"
                    onClick={() => onChangelogClick(changelog.featureId, changelog.featureType)}
                    onMouseOver={() => onChangelogHover(changelog.featureId, changelog.featureType)}
                    onMouseOut={() => onChangelogHover()}
                    sx={{
                      textAlign: 'left',
                    }}
                  >
                    {ReactHtmlParser(changelog.htmlText)}
                  </Link>
                </TimelineContent>
              </TimelineItem>
            ))}
            {changelogs.items.length === 0 && (
              <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                No activity yet.
              </Typography>
            )}
            {changelogs.pagination.cursor && (
              <Button
                loading={isFetching}
                onClick={() => setCursor(changelogs.pagination.cursor)}
                variant="text"
              >
                Load more
              </Button>
            )}
          </Timeline>
        </Box>
      )}
    </FeatureDetailFieldLayout>
  );
};
