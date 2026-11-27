import { useEffect } from 'react';
import { useDispatch } from 'react-redux';


import { centerOfMass } from '@turf/turf';
import { featureApi } from 'app/api/feature-api';
import { FeatureCard, FeatureTag } from 'app/components/FeatureCard';
import { GetSpotDetailsAPIResponse, spotApi } from 'app/api/spot-api';
import { spotTypeOptions } from 'utils/spotTypes';
import { ActivationField } from 'app/components/LineActivation/ActivationField';
import { FeatureContactField } from 'app/components/FeatureDetailFields/FeatureContactField';
import { FeatureHistoryField } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { FeatureMenuActions } from 'app/components/FeatureDetailFields/FeatureMenuActions';
import { FeatureDetailInfoField } from 'app/components/FeatureDetailFields/InfoField';
import { PageItemCard, pageItemOf } from 'app/components/PageItemCard';
import { FeatureMediaField } from 'app/components/FeatureDetailFields/MediaField';
import { OutdatedInfoField } from 'app/components/FeatureDetailFields/OutdatedInfoField';
import { FeatureDetailRestrictionField } from 'app/components/FeatureDetailFields/RestrictionField';
import { format } from 'date-fns';
import { appColors } from 'styles/theme/colors';
import { imageUrlFromS3Key } from 'utils';

interface Props {
  spotId: string;
  onDetailsLoaded: (details: GetSpotDetailsAPIResponse) => void;
}

export const SpotDetailCard = (props: Props) => {
  const dispatch = useDispatch();

  const { data: spotDetails, isFetching, refetch } = spotApi.useGetSpotDetailsQuery(props.spotId);

  useEffect(() => {
    if (spotDetails) {
      props.onDetailsLoaded(spotDetails);
    }
  }, [spotDetails]);

  const onRefreshClicked = () => {
    refetch();
    dispatch(featureApi.util.invalidateTags(['featureChangelogs']));
  };

  const spotCenter = spotDetails?.geoJson
    ? centerOfMass(spotDetails.geoJson).geometry.coordinates
    : undefined;

  const cover =
    spotDetails &&
    imageUrlFromS3Key(spotDetails.images?.find((i) => i.isCover)?.s3Key || spotDetails.images?.[0]?.s3Key);

  const pageItem = pageItemOf('spot', props.spotId);
  if (!spotDetails && pageItem) return <PageItemCard item={pageItem} />;

  return (
    <FeatureCard
      loading={isFetching || !spotDetails}
      image={cover || '/images/coverImageFallback.svg'}
      title={spotDetails?.name || 'Unknown name'}
      tags={
        spotDetails && (
          <>
            <FeatureTag label="Spot" dot={appColors.spotFillColor} />
            {spotDetails.activation && spotDetails.activation.from <= Date.now() / 1000 && <FeatureTag label="Active" color="active" />}
            {spotTypeOptions
              .filter((o) => spotDetails.types?.includes(o.value))
              .map((o) => (
                <FeatureTag key={o.value} label={o.label} />
              ))}
            <FeatureTag
              label={`Updated ${format(new Date(spotDetails.lastModifiedDateTime ?? spotDetails.createdDateTime), 'MMM yyyy')}`}
            />
          </>
        )
      }
      actions={
        spotDetails && (
          <FeatureMenuActions
            editorPermissions={spotDetails.editorPermissions}
            feature={{ id: props.spotId, type: 'spot' }}
            onRefreshClick={onRefreshClicked}
          />
        )
      }
      mapLink={spotCenter}
    >
      {spotDetails && (
        <>
          <ActivationField
            target={{ type: 'spot', id: props.spotId }}
            featureName={spotDetails.name || 'this spot'}
            activation={spotDetails.activation}
            activationDates={spotDetails.activationDates}
            onChanged={refetch}
          />
          <FeatureDetailRestrictionField level={spotDetails.restrictionLevel} restrictionInfo={spotDetails.restrictionInfo} />
          <OutdatedInfoField
            updatedDate={new Date(spotDetails.lastModifiedDateTime ?? spotDetails.createdDateTime)?.toISOString()}
          />
          <FeatureDetailInfoField header="Description" content={spotDetails.description} skipIfEmpty infoType="description" />
          <FeatureDetailInfoField header="Access" content={spotDetails.accessInfo} skipIfEmpty infoType="access" />
          <FeatureContactField
            content={spotDetails.contactInfo}
            contactUserId={spotDetails.creatorUserId}
            feature={{ id: spotDetails.id, type: 'spot' }}
          />
          <FeatureDetailInfoField header="Additional details" content={spotDetails.extraInfo} skipIfEmpty infoType="additional" />
          <FeatureMediaField images={spotDetails.images} />
          <FeatureHistoryField featureId={props.spotId} featureType="spot" createdDateTime={spotDetails.createdDateTime} />
        </>
      )}
    </FeatureCard>
  );
};
