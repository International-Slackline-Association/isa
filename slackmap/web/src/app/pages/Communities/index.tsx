import { useCallback, useEffect, useState } from 'react';
import { MapGeoJSONFeature } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router';

import { Box, Stack } from '@mui/material';

import { communityApi } from 'app/api/community-api';
import { AddMenu } from 'app/components/AddMenu';
import { getSlacklineGroupsGeoJsonOfCountry } from 'app/api/geojson-data';
import { CommunityMap } from 'app/components/Maps/CommunityMap';
import { parseMapFeature } from 'app/components/Maps/mapUtils';
import { FeatureCollection } from 'geojson';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';

import { CommunityCountryDetailCard } from './CommunityCountryDetailCard';
import { SlacklineGroupDetailCard } from './SlacklineGroupDetailCard';
import { useActiveCommunityFeature } from './useCommunityFeature';
import { radius, safeArea, shadow } from 'styles/theme/ui';

export function CommunitiesPage() {
  const navigate = useNavigate();

  const { isDesktop } = useMediaQuery();

  const [activeFeatureGeoJson, setActiveFeatureGeoJson] = useState<FeatureCollection>();

  const { activeFeature } = useActiveCommunityFeature();
  const activeGroupId = activeFeature?.type === 'slacklineGroup' ? activeFeature.id : undefined;
  const { data: activeGroup } = communityApi.useGetGroupDetailsQuery(activeGroupId!, {
    skip: !activeGroupId,
  });

  const updateActiveFeatureGeoJson = useCallback(async () => {
    if (!activeFeature) {
      setActiveFeatureGeoJson(undefined);
      return;
    }
    const { id, type } = activeFeature;
    if (type === 'slacklineGroup') {
      setActiveFeatureGeoJson(activeGroup?.id === id ? activeGroup.geoJson : undefined);
    } else if (type === 'communityCountry') {
      const { geoJson } = await getSlacklineGroupsGeoJsonOfCountry(id);
      setActiveFeatureGeoJson(geoJson);
    }
  }, [activeFeature, activeGroup]);

  const navigateToFeature = useCallback(
    (id: string, type?: CommunityMapFeatureType) => {
      if (!type) return;

      if (type === 'slacklineGroup' || type === 'isaMemberGroup') {
        navigate(`/communities/group/${id}`);
      } else if (type === 'communityCountry') {
        navigate(`/communities/country/${id}`);
      }
    },
    [navigate],
  );

  useEffect(() => {
    updateActiveFeatureGeoJson();
  }, [updateActiveFeatureGeoJson]);

  const onSelectedFeatureChange = useCallback(
    (feature?: MapGeoJSONFeature) => {
      if (!feature) {
        navigate('/communities');
        return;
      }

      const { id, type } = parseMapFeature<CommunityMapFeatureType>(feature);
      navigateToFeature(id, type);
    },
    [activeFeature],
  );

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      sx={{
        minHeight: '100%',
        position: 'relative',
        height: '100%',
        // How much of the map's right edge the open card covers, for the controls to stay clear of it.
        '--card-inset': isDesktop && activeFeature ? 'max(30vw, 352px)' : '0px',
        // On phones the open card is a sheet over the lower 60%; the map's controls sit above it.
        '& .mapboxgl-ctrl-bottom-right': !isDesktop && activeFeature ? { bottom: '60%', mb: '0 !important' } : {},
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: { xs: '100%', lg: '100%' },
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <AddMenu />
        <CommunityMap
          onSelectedFeatureChange={onSelectedFeatureChange}
          activeCommunityFeature={activeFeature}
          activeCommunityFeatureGeoJson={activeFeatureGeoJson}
        />
      </Box>
      {activeFeature && (
        <Box
          sx={{
            flex: 1,
            position: 'absolute',
            top: isDesktop ? 12 : '40%',
            bottom: isDesktop ? 12 : 0,
            right: isDesktop ? 12 : 0,
            width: isDesktop ? 'calc(max(30vw, 352px) - 12px)' : '100%',
            borderRadius: isDesktop ? `${radius.card}px` : '18px 18px 0 0',
            boxShadow: shadow.float,
            overflow: 'hidden',
            zIndex: 4,
            pb: isDesktop ? 0 : safeArea.bottom,
            bgcolor: 'background.paper',
          }}
        >
          {activeFeature.type === 'communityCountry' && (
            <CommunityCountryDetailCard countryCode={activeFeature.id} />
          )}
          {activeFeature.type === 'slacklineGroup' && (
            <SlacklineGroupDetailCard groupId={activeFeature.id} />
          )}
        </Box>
      )}
    </Stack>
  );
}
