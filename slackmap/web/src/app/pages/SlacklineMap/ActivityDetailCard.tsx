import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';

import { activityApi } from 'app/api/activity-api';
import { CloseAndRefreshActions, FeatureCard } from 'app/components/FeatureCard';
import { ActivityHistoryField } from 'app/components/FeatureDetailFields/ActivityHistoryField';
import { FeatureDetailFieldLayout } from 'app/components/FeatureDetailFields/DetailFieldLayout';
import { trimString } from 'utils';

interface Props {
  onChangelogClick: (featureId: string, featureType: SlacklineMapFeatureType) => void;
  onChangelogHover: (featureId?: string, featureType?: SlacklineMapFeatureType) => void;
}

export const ActivityDetailCard = (props: Props) => {
  const [contributorsDisplayLength, setContributorsDisplayLength] = useState(5);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: contributors, isFetching, refetch } = activityApi.useGetGlobalContributorsQuery();

  const onCloseClicked = () => {
    navigate({ pathname: '/' });
  };

  const onRefreshClicked = () => {
    refetch();
    dispatch(activityApi.util.invalidateTags(['activityContributors', 'activityChangelogs']));
  };

  return (
    <FeatureCard
      loading={isFetching || !contributors}
      avatar={
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', color: 'primary.main' }}>
          <TravelExploreIcon fontSize="small" />
        </Avatar>
      }
      title="Global activity"
      actions={<CloseAndRefreshActions onClose={onCloseClicked} onRefresh={onRefreshClicked} />}
    >
      {contributors && (
        <>
          <FeatureDetailFieldLayout
            icon={<EmojiEventsIcon />}
            header={'Top contributors'}
            subHeader={
              'The most active contributors of the last 12 months, by lines, spots and guides created and updated. Updated weekly.'
            }
          >
            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
              {contributors.items.slice(0, contributorsDisplayLength).map((c) => (
                <Stack key={c.user.fullName} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Avatar src={c.user.profilePictureUrl} sx={{ width: 34, height: 34, fontSize: 14 }}>
                    {c.user.fullName.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2Bold" noWrap>
                      {c.user.fullName}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                      {c.user.countryCode && (
                        <Avatar
                          src={`https://hatscripts.github.io/circle-flags/flags/${c.user.countryCode.toLowerCase()}.svg`}
                          sx={{ width: 13, height: 13, bgcolor: 'transparent' }}
                        />
                      )}
                      <Typography variant="caption">
                        {c.user.countryCode && `${trimString(c.user.countryName, 12)} · `}
                        {c.added} created, {c.updated} updated
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              ))}
              {contributorsDisplayLength < contributors.items.length && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={() => setContributorsDisplayLength(contributorsDisplayLength + 10)}
                >
                  Show more
                </Button>
              )}
            </Stack>
          </FeatureDetailFieldLayout>
          <ActivityHistoryField onChangelogClick={props.onChangelogClick} onChangelogHover={props.onChangelogHover} />
        </>
      )}
    </FeatureCard>
  );
};
