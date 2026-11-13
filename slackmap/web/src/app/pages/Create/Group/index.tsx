import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Box, Stack } from '@mui/material';

import { communityApi } from 'app/api/community-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { CommunityMapSources } from 'app/components/Maps/sources/commnunityMapSources';
import { Feature } from 'geojson';

import { GroupEditCard } from './GroupEditCard';
import { validateGroupFeatures } from './validations';

export function CreateGroupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const mapErrors = validateGroupFeatures(features);

  const [createGroup, { data: createdGroup, isLoading: isSaving }] =
    communityApi.useCreateGroupMutation();

  useEffect(() => {
    if (createdGroup) {
      navigate(`/communities/group/${createdGroup.id}`);
    }
  }, [createdGroup]);

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} sx={{ minHeight: '100%' }}>
      <Box
        sx={{
          height: { xs: '50vh', lg: '100vh' },
          width: { xs: '100%', lg: '67%' },
          position: 'relative',
        }}
      >
        <DrawableMap
          initialViewState={mapUrlSearchParams.parse(searchParams)}
          drawControls={{ point: true, trash: true }}
          onDrawingFeaturesChanged={setFeatures}
          drawControlStyles={drawControlStyles('group')}
          sources={<CommunityMapSources />}
          showGeocoder
        />
      </Box>
      <Box sx={{ flex: 1, height: { xs: 'auto', lg: '100vh' } }}>
        <GroupEditCard
          mapErrors={features.length > 0 ? mapErrors : []}
          onSubmit={(values) =>
            createGroup({ ...values, geoJson: { type: 'FeatureCollection', features } })
          }
          disableSubmit={mapErrors.length > 0}
          isSubmitting={isSaving}
        />
      </Box>
    </Stack>
  );
}
