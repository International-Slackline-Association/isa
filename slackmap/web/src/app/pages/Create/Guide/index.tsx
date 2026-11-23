import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';


import { guideApi } from 'app/api/guide-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { Feature, FeatureCollection } from 'geojson';

import { GuideEditCard } from './GuideEditCard';
import { GuideDetailsForm } from './types';
import { validateGuideFeatures } from './validations';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

export function CreateGuidePage() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [features, setFeatures] = useState<Feature[]>([]);
  const [mapErrors, setMapErrors] = useState<string[]>([]);

  const [createGuide, { isLoading: isSaving, data: createdGuide }] =
    guideApi.useCreateGuideMutation();

  useEffect(() => {
    if (createdGuide) {
      navigate(`/guide/${createdGuide.id}`);
    }
  }, [createdGuide]);

  useEffect(() => {
    const errors = validateGuideFeatures(features);
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

  const onDetailsSubmit = (values: GuideDetailsForm) => {
    const geoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    createGuide({ ...values, geoJson });
  };
  return (
    <FeatureFormLayout
      map={
        <>
          <DrawableMap
            initialViewState={mapUrlSearchParams.parse(searchParams)}
            drawControls={{
              point: true,
              polygon: true,
              line_string: true,
              trash: true,
            }}
            onDrawingFeaturesChanged={onDrawingFeaturesChanged}
            drawControlStyles={drawControlStyles('guide')}
          />
        </>
      }
      form={
        <>
          <GuideEditCard
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
