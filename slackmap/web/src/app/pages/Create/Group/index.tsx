import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';


import { communityApi } from 'app/api/community-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { CommunityMapSources } from 'app/components/Maps/sources/commnunityMapSources';
import { Feature } from 'geojson';

import { GroupEditCard } from './GroupEditCard';
import { validateGroupFeatures } from './validations';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

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
    <FeatureFormLayout
      map={
        <>
          <DrawableMap
            initialViewState={mapUrlSearchParams.parse(searchParams)}
            drawControls={{ point: true, trash: true }}
            onDrawingFeaturesChanged={setFeatures}
            drawControlStyles={drawControlStyles('group')}
            sources={<CommunityMapSources />}
            showGeocoder
          />
        </>
      }
      form={
        <>
          <GroupEditCard
            mapChanged={features.length > 0}
            mapErrors={features.length > 0 ? mapErrors : []}
            onSubmit={(values) =>
              createGroup({ ...values, geoJson: { type: 'FeatureCollection', features } })
            }
            disableSubmit={mapErrors.length > 0}
            isSubmitting={isSaving}
          />
        </>
      }
    />
  );
}
