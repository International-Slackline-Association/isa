import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router';


import { length } from '@turf/turf';
import { lineApi } from 'app/api/line-api';
import { DrawableMap } from 'app/components/Maps/SlacklineMap/DrawableMap';
import { drawControlStyles } from 'app/components/Maps/SlacklineMap/DrawableMap/DrawControl/styles';
import { mapUrlSearchParams } from 'app/components/Maps/mapUtils';
import { CreateLineTutorial } from 'app/components/Tutorials/CreateLineTutorial';
import { Feature, FeatureCollection } from 'geojson';
import { showInfoNotification } from 'utils';

import { LineEditCard } from './LineEditCard';
import { LineDetailsForm } from './types';
import { validateLineFeatures } from './validations';
import { FeatureFormLayout } from 'app/components/FeatureFormLayout';

export function CreateLinePage() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [features, setFeatures] = useState<Feature[]>([]);
  const [mapErrors, setMapErrors] = useState<string[]>([]);

  const [createLine, { isLoading: isSaving, isSuccess: isSavedChanges }] =
    lineApi.useCreateLineMutation();

  useEffect(() => {
    if (isSavedChanges) {
      navigate({ pathname: '/', search: searchParams.toString() });
    }
  }, [isSavedChanges]);

  useEffect(() => {
    const errors = validateLineFeatures(features);
    if (errors.length > 0) {
      setMapErrors(errors);
      return;
    } else {
      setMapErrors([]);
      const lineLength = length(features[0], {
        units: 'meters',
      });
      dispatch(showInfoNotification(`Length: ${lineLength.toFixed(2)}m`, 5000));
    }
  }, [features]);

  const onDrawingFeaturesChanged = (features: Feature[]) => {
    setFeatures(features);
  };

  const onDetailsSubmit = (values: LineDetailsForm) => {
    const geoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    createLine({ ...values, geoJson });
  };
  return (
    <FeatureFormLayout
      map={
        <>
          <CreateLineTutorial />
          <DrawableMap
            initialViewState={mapUrlSearchParams.parse(searchParams)}
            drawControls={{
              polygon: false,
              line_string: true,
              trash: true,
            }}
            onDrawingFeaturesChanged={onDrawingFeaturesChanged}
            drawControlStyles={drawControlStyles('line')}
          />
        </>
      }
      form={
        <>
          <LineEditCard
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
