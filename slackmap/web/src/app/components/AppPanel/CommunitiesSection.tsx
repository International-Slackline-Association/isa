import { useEffect, useState } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { getCommunityMapStats } from 'app/api/geojson-data';
import { appColors } from 'styles/theme/colors';

const Count = (props: { color: string; label: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: props.color }} />
    <Typography variant="body2">{props.label}</Typography>
  </Stack>
);

export const CommunitiesSection = () => {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getCommunityMapStats>>>();

  useEffect(() => {
    getCommunityMapStats().then(setStats);
  }, []);

  return (
    <Stack spacing={1.5} sx={{ mt: 1.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Find people to slackline with. Click a group on the map, or a country for all of its groups.
      </Typography>
      {stats && (
        <Stack spacing={0.75}>
          <Count
            color={appColors.isaMemberGroupColor}
            label={`${stats.isaMembersCount} ISA members & partners`}
          />
          <Count color={appColors.slacklineGroupColor} label={`${stats.slacklineGroupsCount} slackline groups`} />
          <Count color={appColors.countryColor} label={`in ${stats.countryCount} countries`} />
        </Stack>
      )}
    </Stack>
  );
};
