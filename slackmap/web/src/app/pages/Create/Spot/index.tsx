import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';


import { spotApi } from 'app/api/spot-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { Feature, FeatureCollection } from 'geojson';

import { SpotEditCard } from './SpotEditCard';
import { SpotDetailsForm } from './types';
import { validateSpotFeatures } from './validations';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

export function CreateSpotPage() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [features, setFeatures] = useState<Feature[]>([]);
  const [mapErrors, setMapErrors] = useState<string[]>([]);

  const [createSpot, { isLoading: isSaving, data: createdSpot }] =
    spotApi.useCreateSpotMutation();

  useEffect(() => {
    if (createdSpot) {
      navigate(`/spot/${createdSpot.id}`);
    }
  }, [createdSpot]);

  useEffect(() => {
    const errors = validateSpotFeatures(features);
    if (errors.length > 0) {
      setMapErrors(errors);
      return;
    } else {
      setMapErrors([]);
    }
  }, [features]);

  const onDrawingFeaturesChanged = (features: Feature[]) => {
    setFeatures(features);
  };

  const onDetailsSubmit = (values: SpotDetailsForm) => {
    const geoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    createSpot({ ...values, geoJson });
  };
  return (
    <FeatureFormLayout
      map={
        <>
          <DrawableMap
            initialViewState={mapUrlSearchParams.parse(searchParams)}
            drawControls={{
              polygon: true,
              line_string: false,
              trash: true,
            }}
            onDrawingFeaturesChanged={onDrawingFeaturesChanged}
            drawControlStyles={drawControlStyles('spot')}
          />
        </>
      }
      form={
        <>
          <SpotEditCard
            mapChanged={features.length > 0}
            mapErrors={mapErrors}
            onSubmit={onDetailsSubmit}
            disableSubmit={features.length === 0 || mapErrors.length > 0}
            isSubmitting={isSaving}
          />
        </>
      }
    />
  );
}
