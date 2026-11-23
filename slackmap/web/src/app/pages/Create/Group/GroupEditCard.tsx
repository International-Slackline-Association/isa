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

import { isaMemberTypeLabel } from 'app/pages/Communities/GroupsManifestText';
import { FormikProps, useFormik } from 'formik';

import { CancelEditButton, EditingTextFieldHeader } from '../Line/LineEditCard';
import { GroupDetailsForm, groupLinkFields } from './types';
import { cleanGroupValues, validateGroupValues } from './validations';

interface Props {
  // Whether the drawing on the map differs from the saved or empty one.
  mapChanged?: boolean;
  initialValues?: GroupDetailsForm;
  mapErrors?: string[];
  onSubmit: (values: ReturnType<typeof cleanGroupValues>) => void;
  disableSubmit?: boolean;
  isSubmitting?: boolean;
  canManageMembership?: boolean;
}

const memberTypes = ['active', 'observer', 'associate', 'partner'] as const;

export const GroupEditCard = (props: Props) => {
  const isCreateMode = !props.initialValues;

  const formik = useFormik<GroupDetailsForm>({
    initialValues: props.initialValues ?? { name: '' },
    validate: validateGroupValues,
    onSubmit: (values) => props.onSubmit(cleanGroupValues(values)),
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.25 }}>
        <Typography variant="h4" component="h1">
            {isCreateMode ? 'Add a slackline group' : 'Edit slackline group'}
          </Typography>
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
            <EditingTextFieldHeader>Details</EditingTextFieldHeader>
            <EditingTextField formik={formik} field={'name'} label={'Name of the group'} required />

            <EditingTextFieldHeader subHeader="Everything here is public. At least one is needed.">
              Contact
            </EditingTextFieldHeader>
            <EditingTextField formik={formik} field={'email'} label={'Email'} />
            {groupLinkFields.map(({ field, label }) => (
              <EditingTextField key={field} formik={formik} field={field} label={label} />
            ))}

            {props.canManageMembership && (
              <>
                <EditingTextFieldHeader subHeader="Only ISA sets this. A recognized group is edited by ISA only.">
                  ISA Membership
                </EditingTextFieldHeader>
                <EditingTextField formik={formik} select field="isaMemberType" label="Membership">
                  <MenuItem value={''}>Not a member</MenuItem>
                  {memberTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {isaMemberTypeLabel(type)}
                    </MenuItem>
                  ))}
                </EditingTextField>
                {formik.values.isaMemberType && (
                  <EditingTextField
                    formik={formik}
                    field={'isaMemberInfoUrl'}
                    label={'Membership info link'}
                  />
                )}
              </>
            )}

          </Stack>
        </>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', px: 2, py: 1.25, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        <CancelEditButton
          noun="group"
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
  formik: FormikProps<GroupDetailsForm>;
  field: keyof GroupDetailsForm;
}
const EditingTextField = (props: EditingTextFieldProps) => {
  const { formik, field, ...rest } = props;
  return (
    <TextField
      fullWidth
      name={field}
      value={formik.values[field] ?? ''}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[field] && Boolean(formik.errors[field])}
      helperText={formik.touched[field] && formik.errors[field]}
      autoComplete="off"
      {...rest}
    />
  );
};
