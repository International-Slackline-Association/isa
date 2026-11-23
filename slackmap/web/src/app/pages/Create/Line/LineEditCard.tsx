import React, { ReactNode } from 'react';

import Button from '@mui/material/Button';
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  StandardTextFieldProps,
  TextField,
  Typography,
} from '@mui/material';

import { SlacklineRestrictionLevel, SlacklineType } from '@server/core/types';
import { S3ImageList, S3PhotoMeta } from 'app/components/ImageList';
import { useFormik } from 'formik';

import { LineDetailsForm } from './types';
import { useLocation, useNavigate } from 'react-router';
import { useConfirmDialog } from 'app/components/Dialogs/useConfirmDialog';

const lineTypes: { value: SlacklineType; label: string }[] = [
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'highline',
    label: 'Highline',
  },
  {
    value: 'waterline',
    label: 'Waterline',
  },
  {
    value: 'midline',
    label: 'Midline',
  },

  {
    value: 'longline',
    label: 'Longline',
  },
  {
    value: 'rodeoline',
    label: 'Rodeoline',
  },
  {
    value: 'trickline',
    label: 'Trickline',
  },
  {
    value: 'parkline',
    label: 'Parkline',
  },
];

export const restrictionSelectOptions: {
  value: SlacklineRestrictionLevel;
  label: string;
}[] = [
  {
    value: 'none',
    label: 'None',
  },
  {
    value: 'partial',
    label: 'Partially Restricted',
  },
  {
    value: 'full',
    label: 'Fully Restricted',
  },
];
interface Props {
  // Whether the drawing on the map differs from the saved or empty one.
  mapChanged?: boolean;
  initialValues?: LineDetailsForm;
  mapErrors?: string[];
  onSubmit: (values: LineDetailsForm) => void;
  disableSubmit?: boolean;
  isSubmitting?: boolean;
}

const cleanValues = (values: LineDetailsForm): LineDetailsForm => {
  return {
    ...values,
    length: values.length || undefined, // avoid empty string
    height: values.height || undefined,
  };
};

export const LineEditCard = (props: Props) => {
  const isCreateMode = !props.initialValues;

  const [images, setImages] = React.useState<S3PhotoMeta[]>(props.initialValues?.images ?? []);
  const [anchorImages, setAnchorImages] = React.useState<S3PhotoMeta[]>(
    props.initialValues?.anchorImages ?? [],
  );

  const onImagesChanged = (photos: S3PhotoMeta[]) => {
    setImages(photos);
  };

  const onAnchorImagesChanged = (photos: S3PhotoMeta[]) => {
    setAnchorImages(photos);
  };

  // const validationSchema = z.object({});
  const formik = useFormik<LineDetailsForm>({
    initialValues: props.initialValues ?? {
      isMeasured: false,
      type: 'other',
      restrictionLevel: 'none',
    },
    // validationSchema: toFormikValidationSchema(validationSchema),
    // validateOnChange: true,
    onSubmit: (values) => {
      const allValues = {
        ...values,
        images: images,
        anchorImages: anchorImages,
      };
      props.onSubmit(cleanValues(allValues));
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.25 }}>
        <Typography variant="h4" component="h1">{isCreateMode ? 'Add a line' : 'Edit line'}</Typography>
      </Box>
      <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2, scrollbarWidth: 'thin' }}>
        <Stack spacing={1}>
          {props.mapErrors?.map((e) => (
            <Alert key={e} severity="error">
              {e}
            </Alert>
          ))}
        </Stack>
        <>
          <Stack spacing={1}>
            <EditingTextFieldHeader>Specs</EditingTextFieldHeader>

            <EditingTextField formik={formik} select field="type" label="Type" required>
              {lineTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </EditingTextField>

            <EditingTextField
              formik={formik}
              field="length"
              label="Length (meters)"
              type="number"
            />

            <EditingTextField
              formik={formik}
              field="height"
              label="Height (meters)"
              type="number"
            />

            <FormControlLabel
              control={<Checkbox />}
              label="Accurately measured"
              checked={formik.values.isMeasured}
              name="isMeasured"
              onChange={formik.handleChange}
            />

            <EditingTextFieldHeader>Details</EditingTextFieldHeader>

            <EditingTextField formik={formik} field={'name'} label={'Name of the line'} />
            <EditingTextField
              formik={formik}
              field={'description'}
              label={'Description'}
              multiline
            />
            <EditingTextField
              formik={formik}
              field={'anchorsInfo'}
              label={'Anchors'}
              multiline
            />
            <EditingTextField
              formik={formik}
              field={'gearInfo'}
              label={'Gear'}
              multiline
            />
            <EditingTextField
              formik={formik}
              field={'accessInfo'}
              label={'Access'}
              multiline
            />
            <EditingTextField
              formik={formik}
              field={'contactInfo'}
              label={'Contact'}
              multiline
            />
            <EditingTextField
              formik={formik}
              field={'extraInfo'}
              label={'Additional details'}
              multiline
            />

            <EditingTextFieldHeader subHeader='Access restriction warnings will be displayed to viewers to prevent further problems with access. "Partial" restriction warnings need to be taken seriously, defined procedures need to be followed, "Full" restriction means the line is either illegal or can not be rigged anymore.'>
              Restriction
            </EditingTextFieldHeader>

            <EditingTextField
              formik={formik}
              select
              field="restrictionLevel"
              label="Restriction level"
              required
            >
              <MenuItem value={''}></MenuItem>
              {restrictionSelectOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </EditingTextField>

            <EditingTextField
              formik={formik}
              field={'restrictionInfo'}
              label={'Restriction details'}
              multiline
              placeholder="Don't forget to add your contact info for people to reach you"
            />

            <EditingTextFieldHeader subHeader="Upload your anchor photos to document your line. Max 5 photos. All the photos are publicly viewable.">
              Anchor photos
            </EditingTextFieldHeader>

            <S3ImageList
              photos={props.initialValues?.anchorImages}
              onPhotosChanged={onAnchorImagesChanged}
              maxPhotoCount={5}
              htmlId="anchor-images"
              disableCoverPhoto
            />

            <EditingTextFieldHeader subHeader="Upload your line photos. Max 3 images. All the photos are publicly viewable.">
              Line photos
            </EditingTextFieldHeader>

            <S3ImageList
              photos={props.initialValues?.images}
              onPhotosChanged={onImagesChanged}
              maxPhotoCount={3}
              htmlId="line-images"
            />

          </Stack>
        </>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', px: 2, py: 1.25, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        <CancelEditButton
          noun="line"
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

export const CancelEditButton = (props: { hasChanges: boolean; isCreateMode: boolean; noun: string }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { ConfirmDialog, showConfirmDialog } = useConfirmDialog();
  const backTo = pathname.endsWith('/edit')
    ? pathname.slice(0, -'/edit'.length)
    : pathname.startsWith('/communities')
      ? '/communities'
      : '/';
  const leave = () => navigate({ pathname: backTo, search });

  return (
    <>
      <ConfirmDialog />
      <Button
        variant="outlined"
        onClick={() =>
          props.hasChanges
            ? showConfirmDialog({
                title: props.isCreateMode ? `Discard this ${props.noun}?` : 'Discard your changes?',
                description: props.isCreateMode
                  ? `What you drew and wrote for this ${props.noun} will be lost.`
                  : 'Your edits will be lost. The saved version stays as it was.',
                confirmText: 'Discard',
                cancelText: 'Keep editing',
                destructive: true,
                onConfirm: leave,
              })
            : leave()
        }
      >
        Cancel
      </Button>
    </>
  );
};

export const EditingTextFieldHeader = (props: { children: ReactNode; subHeader?: string }) => {
  const { children, subHeader } = props;

  return (
    <Box sx={{ pt: 1.5 }}>
      <Typography variant="h6" component="h2">
        {children}
      </Typography>
      {subHeader && (
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {subHeader}
        </Typography>
      )}
    </Box>
  );
};

interface EditingTextFieldProps extends StandardTextFieldProps {
  formik: any;
  field: keyof LineDetailsForm;
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
