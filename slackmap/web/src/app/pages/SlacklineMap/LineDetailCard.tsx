import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { centerOfMass } from '@turf/turf';
import { featureApi } from 'app/api/feature-api';
import { FeatureCard, FeatureStats, FeatureTag } from 'app/components/FeatureCard';
import { GetLineDetailsAPIResponse, lineApi } from 'app/api/line-api';
import { FeatureContactField } from 'app/components/FeatureDetailFields/FeatureContactField';
import { FeatureHistoryField } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { FeatureMenuActions } from 'app/components/FeatureDetailFields/FeatureMenuActions';
import { FeatureDetailInfoField } from 'app/components/FeatureDetailFields/InfoField';
import { FeatureMediaField } from 'app/components/FeatureDetailFields/MediaField';
import { OutdatedInfoField } from 'app/components/FeatureDetailFields/OutdatedInfoField';
import { FeatureDetailRestrictionField } from 'app/components/FeatureDetailFields/RestrictionField';
import { ActivationField } from 'app/components/LineActivation/ActivationField';
import { ActiveSpotNote } from 'app/components/LineActivation/ActiveSpotNote';
import { format } from 'date-fns';
import { appColors } from 'styles/theme/colors';
import { imageUrlFromS3Key } from 'utils';

interface Props {
  lineId: string;
  onDetailsLoaded: (details: GetLineDetailsAPIResponse) => void;
}

export const LineDetailCard = (props: Props) => {
  const dispatch = useDispatch();

  const { data: lineDetails, isFetching, refetch } = lineApi.useGetLineDetailsQuery(props.lineId);

  useEffect(() => {
    if (lineDetails) {
      props.onDetailsLoaded(lineDetails);
    }
  }, [lineDetails]);

  const onRefreshClicked = () => {
    refetch();
    dispatch(featureApi.util.invalidateTags(['featureChangelogs']));
  };

  const lineCenter = lineDetails?.geoJson
    ? centerOfMass(lineDetails.geoJson).geometry.coordinates
    : undefined;

  const cover =
    lineDetails &&
    imageUrlFromS3Key(lineDetails.images?.find((i) => i.isCover)?.s3Key || lineDetails.images?.[0]?.s3Key);

  return (
    <FeatureCard
      loading={isFetching || !lineDetails}
      image={cover || '/images/coverImageFallback.svg'}
      title={lineDetails?.name || 'No name'}
      tags={
        lineDetails && (
          <>
            {lineDetails.activation && lineDetails.activation.from <= Date.now() / 1000 && <FeatureTag label="Active" color="live" />}
            <FeatureTag label={capitalize(lineDetails.type) || 'Line'} dot={appColors.lineStrokeColor} />
            <FeatureTag
              label={`Updated ${format(new Date(lineDetails.lastModifiedDateTime ?? lineDetails.createdDateTime), 'MMM yyyy')}`}
            />
          </>
        )
      }
      actions={
        lineDetails && (
          <FeatureMenuActions
            editorPermissions={lineDetails.editorPermissions}
            feature={{ id: props.lineId, type: 'line' }}
            onRefreshClick={onRefreshClicked}
          />
        )
      }
      mapLink={lineCenter}
    >
      {lineDetails && (
        <>
          <FeatureStats
            items={[
              { value: `${lineDetails.length || '?'} m`, label: 'length' },
              { value: `${lineDetails.height || '?'} m`, label: 'height' },
              { value: lineDetails.isMeasured ? 'Measured' : 'Approx.', label: lineDetails.isMeasured ? 'accuracy' : 'not measured' },
            ]}
          />
          <ActivationField
            target={{ type: 'line', id: props.lineId }}
            featureName={lineDetails.name || 'this line'}
            activation={lineDetails.activation}
            onChanged={refetch}
          />
          <ActiveSpotNote lineGeoJson={lineDetails.geoJson} />
          <FeatureDetailRestrictionField level={lineDetails.restrictionLevel} restrictionInfo={lineDetails.restrictionInfo} />
          <OutdatedInfoField
            updatedDate={new Date(lineDetails.lastModifiedDateTime ?? lineDetails.createdDateTime)?.toISOString()}
          />
          <FeatureDetailInfoField header="Description" content={lineDetails.description} skipIfEmpty infoType="description" />
          <FeatureDetailInfoField header="Anchors" content={lineDetails.anchorsInfo} skipIfEmpty infoType="anchors" />
          <FeatureDetailInfoField header="Access" content={lineDetails.accessInfo} skipIfEmpty infoType="access" />
          <FeatureDetailInfoField header="Gear" content={lineDetails.gearInfo} skipIfEmpty infoType="gear" />
          <FeatureContactField
            content={lineDetails.contactInfo}
            contactUserId={lineDetails.creatorUserId}
            feature={{ id: lineDetails.id, type: 'line' }}
          />
          <FeatureDetailInfoField header="Additional details" content={lineDetails.extraInfo} skipIfEmpty infoType="additional" />
          <FeatureMediaField images={lineDetails.anchorImages} type={'anchor-images'} />
          <FeatureMediaField images={lineDetails.images} />
          <FeatureHistoryField featureId={props.lineId} featureType="line" createdDateTime={lineDetails.createdDateTime} />
        </>
      )}
    </FeatureCard>
  );
};

const capitalize = (s?: string) => s && s.charAt(0).toUpperCase() + s.slice(1);
