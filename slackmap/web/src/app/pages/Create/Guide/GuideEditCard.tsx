import React from 'react';

import Button from '@mui/material/Button';
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  StandardTextFieldProps,
  TextField,
  Typography,
} from '@mui/material';

import { GuideType } from '@server/core/types';
import { S3ImageList, S3PhotoMeta } from 'app/components/ImageList';
import { useFormik } from 'formik';

import { CancelEditButton, EditingTextFieldHeader } from '../Line/LineEditCard';
import { GuideDetailsForm } from './types';

const guideTypes: { value: GuideType; label: string }[] = [
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'parkingLot',
    label: 'Parking Lot',
  },
  {
    value: 'accessPath',
    label: 'Access Path',
  },
  {
    value: 'campingSpot',
    label: 'Camping Spot',
  },
  {
    value: 'riggingPath',
    label: 'Rigging Path',
  },
  {
    value: 'information',
    label: 'Information',
  },
];

interface Props {
  // Whether the drawing on the map differs from the saved or empty one.
  mapChanged?: boolean;
  initialValues?: GuideDetailsForm;
  mapErrors?: string[];
  onSubmit: (values: GuideDetailsForm) => void;
  disableSubmit?: boolean;
  isSubmitting?: boolean;
}

const cleanValues = (values: GuideDetailsForm): GuideDetailsForm => {
  return {
    ...values, // Nothing needed
  };
};

export const GuideEditCard = (props: Props) => {
  const isCreateMode = !props.initialValues;

  const [images, setImages] = React.useState<S3PhotoMeta[]>(props.initialValues?.images ?? []);

  const onPhotosChanged = (photos: S3PhotoMeta[]) => {
    setImages(photos);
  };

  // const validationSchema = z.object({});
  const formik = useFormik<GuideDetailsForm>({
    initialValues: props.initialValues ?? {
      type: 'other',
    },
    // validationSchema: toFormikValidationSchema(validationSchema),
    // validateOnChange: true,
    onSubmit: (values) => {
      const allValues = { ...values, images: images };
      props.onSubmit(cleanValues(allValues));
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.25 }}>
        <>
            <Typography variant="h4" component="h1">
              {isCreateMode ? 'Add an access guide' : 'Edit access guide'}
            </Typography>
          </>
      </Box>
      <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2, scrollbarWidth: 'thin' }}>
        {isCreateMode && (
          <Typography variant="caption">
            Access guides are used to provide extra visual information for the viewers. You can draw
            anything that can be helpful for the given area, such like parking lots, campings spots,
            hiking paths etc..
          </Typography>
        )}
        <Stack spacing={1}>
          {props.mapErrors?.map((e) => (
            <Alert key={e} severity="error">
              {e}
            </Alert>
          ))}
        </Stack>
        <>
          <Stack spacing={1}>
            <EditingTextFieldHeader>Details</EditingTextFieldHeader>

            <EditingTextField formik={formik} select field="type" label="Type" required>
              {guideTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </EditingTextField>

            <EditingTextField
              formik={formik}
              field={'description'}
              label={'Description'}
              multiline
            />

            <EditingTextFieldHeader subHeader="Upload your photos for better exprience. Max 2 photos. All the photos are publicly viewable.">
              Photos
            </EditingTextFieldHeader>

            <S3ImageList
              photos={props.initialValues?.images}
              onPhotosChanged={onPhotosChanged}
              maxPhotoCount={2}
            />

          </Stack>
        </>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', px: 2, py: 1.25, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        <CancelEditButton
          noun="access guide"
          isCreateMode={isCreateMode}
          hasChanges={formik.dirty || Boolean(props.mapChanged)}
        />
        <Button variant="contained" type="submit" disabled={props.disableSubmit} loading={props.isSubmitting}>
          Save
        </Button>
      </Stack>
    </Box>
  );
};

interface EditingTextFieldProps extends StandardTextFieldProps {
  formik: any;
  field: keyof GuideDetailsForm;
}
const EditingTextField = (props: EditingTextFieldProps) => {
  const { formik, field, ...rest } = props;

  return (
    <TextField
      fullWidth
      name={field}
      value={formik.values[field]}
      onChange={formik.handleChange}
      error={formik.touched[field] && Boolean(formik.errors[field])}
      helperText={formik.touched[field] && formik.errors[field]}
      autoComplete="off"
      {...rest}
    />
  );
};
