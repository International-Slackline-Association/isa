import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';


import { spotApi } from 'app/api/spot-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { SpotEditCard } from 'app/pages/Create/Spot/SpotEditCard';
import { SpotDetailsForm } from 'app/pages/Create/Spot/types';
import { validateSpotFeatures } from 'app/pages/Create/Spot/validations';
import { Feature, FeatureCollection } from 'geojson';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

export function SpotEditPage() {
  const { spotId } = useParams();
  const navigate = useNavigate();

  const [features, setFeatures] = useState<Feature[]>([]);
  const [mapErrors, setMapErrors] = useState<string[]>([]);

  const { data: spotDetails } = spotApi.useGetSpotDetailsQuery(spotId!);

  const [updateSpot, { isLoading: isSaving, isSuccess: isSavedChanges }] =
    spotApi.useUpdateSpotMutation();

  useEffect(() => {
    if (isSavedChanges) {
      navigate({ pathname: `/spot/${spotId}` });
    }
  }, [isSavedChanges]);

  useEffect(() => {
    const errors = validateSpotFeatures(features);
    if (errors.length > 0) {
      setMapErrors(errors);
      return;
    } else {
      setMapErrors([]);
    }
  }, [features]);

  useEffect(() => {
    if (spotDetails) {
      setFeatures(spotDetails.geoJson.features as Feature[]);
    }
  }, [spotDetails]);

  const onDrawingFeaturesChanged = (features: Feature[]) => {
    setFeatures(features);
  };

  const onDetailsSubmit = (values: SpotDetailsForm) => {
    const geoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    updateSpot({ id: spotId!, payload: { ...values, geoJson } });
  };

  return (
    <FeatureFormLayout
      map={
        <>
          {spotDetails?.geoJson && (
            <DrawableMap
              drawControls={{
                polygon: true,
                line_string: false,
                trash: true,
              }}
              onDrawingFeaturesChanged={onDrawingFeaturesChanged}
              drawControlStyles={drawControlStyles('spot')}
              drawingFeatures={spotDetails.geoJson.features as Feature[]}
            />
          )}
        </>
      }
      form={
        <>
          {spotDetails && (
            <SpotEditCard
              mapChanged={JSON.stringify(features) !== JSON.stringify(spotDetails.geoJson.features)}
              mapErrors={mapErrors}
              onSubmit={onDetailsSubmit}
              disableSubmit={features.length === 0 || mapErrors.length > 0}
              isSubmitting={isSaving}
              initialValues={{
                accessInfo: spotDetails.accessInfo,
                description: spotDetails.description,
                types: spotDetails.types,
                name: spotDetails.name,
                contactInfo: spotDetails.contactInfo,
                extraInfo: spotDetails.extraInfo,
                restrictionInfo: spotDetails.restrictionInfo,
                restrictionLevel: spotDetails.restrictionLevel,
                images: spotDetails.images,
              }}
            />
          )}
        </>
      }
    />
  );
}
