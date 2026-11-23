import { useEffect } from 'react';
import { useDispatch } from 'react-redux';


import { centerOfMass } from '@turf/turf';
import { featureApi } from 'app/api/feature-api';
import { FeatureCard, FeatureTag } from 'app/components/FeatureCard';
import { GetGuideDetailsAPIResponse, guideApi } from 'app/api/guide-api';
import { FeatureHistoryField } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { FeatureMenuActions } from 'app/components/FeatureDetailFields/FeatureMenuActions';
import { FeatureDetailInfoField } from 'app/components/FeatureDetailFields/InfoField';
import { FeatureMediaField } from 'app/components/FeatureDetailFields/MediaField';
import { OutdatedInfoField } from 'app/components/FeatureDetailFields/OutdatedInfoField';
import { format } from 'date-fns';
import { appColors } from 'styles/theme/colors';
import { imageUrlFromS3Key } from 'utils';

interface Props {
  guideId: string;
  onDetailsLoaded: (details: GetGuideDetailsAPIResponse) => void;
}

export const GuideDetailCard = (props: Props) => {
  const dispatch = useDispatch();

  const {
    data: guideDetails,
    isFetching,
    refetch,
  } = guideApi.useGetGuideDetailsQuery(props.guideId);

  useEffect(() => {
    if (guideDetails) {
      props.onDetailsLoaded(guideDetails);
    }
  }, [guideDetails]);

  const onRefreshClicked = () => {
    refetch();
    dispatch(featureApi.util.invalidateTags(['featureChangelogs']));
  };

  const guideCenter = guideDetails?.geoJson
    ? centerOfMass(guideDetails.geoJson).geometry.coordinates
    : undefined;

  const cover =
    guideDetails &&
    imageUrlFromS3Key(guideDetails.images?.find((i) => i.isCover)?.s3Key || guideDetails.images?.[0]?.s3Key);

  return (
    <FeatureCard
      loading={isFetching || !guideDetails}
      image={cover || '/images/coverImageFallback.svg'}
      title={guideDetails?.typeLabel}
      tags={
        guideDetails && (
          <>
            <FeatureTag label="Access guide" dot={appColors.guideFeaturesColor} />
            <FeatureTag
              label={`Updated ${format(new Date(guideDetails.lastModifiedDateTime ?? guideDetails.createdDateTime), 'MMM yyyy')}`}
            />
          </>
        )
      }
      actions={
        guideDetails && (
          <FeatureMenuActions
            editorPermissions={guideDetails.editorPermissions}
            feature={{ id: props.guideId, type: 'guide' }}
            onRefreshClick={onRefreshClicked}
          />
        )
      }
      mapLink={guideCenter}
    >
      {guideDetails && (
        <>
          <OutdatedInfoField
            updatedDate={new Date(guideDetails.lastModifiedDateTime ?? guideDetails.createdDateTime)?.toISOString()}
          />
          <FeatureDetailInfoField header="Description" content={guideDetails.description} skipIfEmpty infoType="description" />
          <FeatureMediaField images={guideDetails.images} />
          <FeatureHistoryField featureId={props.guideId} featureType="guide" createdDateTime={guideDetails.createdDateTime} />
        </>
      )}
    </FeatureCard>
  );
};
