import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';


import { communityApi } from 'app/api/community-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { CommunityMapSources } from 'app/components/Maps/sources/commnunityMapSources';
import { GroupEditCard } from 'app/pages/Create/Group/GroupEditCard';
import { validateGroupFeatures } from 'app/pages/Create/Group/validations';
import { Feature } from 'geojson';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

export function GroupEditPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const mapErrors = validateGroupFeatures(features);

  const { data: group } = communityApi.useGetGroupDetailsQuery(groupId!);
  const [updateGroup, { isLoading: isSaving, isSuccess: isSaved }] =
    communityApi.useUpdateGroupMutation();

  useEffect(() => {
    if (isSaved) {
      navigate(`/communities/group/${groupId}`);
    }
  }, [isSaved]);

  useEffect(() => {
    if (group) {
      setFeatures(group.geoJson.features as Feature[]);
    }
  }, [group]);

  return (
    <FeatureFormLayout
      map={
        <>
          {group && (
            <DrawableMap
              drawControls={{ point: true, trash: true }}
              onDrawingFeaturesChanged={setFeatures}
              drawControlStyles={drawControlStyles('group')}
              drawingFeatures={group.geoJson.features as Feature[]}
              sources={<CommunityMapSources />}
              showGeocoder
            />
          )}
        </>
      }
      form={
        <>
          {group && (
            <GroupEditCard
              mapChanged={JSON.stringify(features) !== JSON.stringify(group.geoJson.features)}
              mapErrors={mapErrors}
              onSubmit={(values) =>
                updateGroup({
                  id: group.id,
                  payload: { ...values, geoJson: { type: 'FeatureCollection', features } },
                })
              }
              disableSubmit={mapErrors.length > 0}
              isSubmitting={isSaving}
              canManageMembership={group.editorPermissions?.canManageMembership}
              initialValues={{
                name: group.name,
                email: group.email,
                facebookPage: group.facebookPage,
                facebookGroup: group.facebookGroup,
                instagram: group.instagram,
                telegram: group.telegram,
                whatsapp: group.whatsapp,
                webpage: group.webpage,
                isaMemberType: group.isaMembership?.type ?? '',
                isaMemberInfoUrl: group.isaMembership?.infoUrl,
              }}
            />
          )}
        </>
      }
    />
  );
}
