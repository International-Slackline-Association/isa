import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import {
  Alert,
  MenuItem,
  Stack,
  StandardTextFieldProps,
  TextField,
  Typography,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

import { isaMemberTypeLabel } from 'app/pages/Communities/GroupsManifestText';
import { FormikProps, useFormik } from 'formik';

import { EditingTextFieldHeader } from '../Line/LineEditCard';
import { GroupDetailsForm, groupLinkFields } from './types';
import { cleanGroupValues, validateGroupValues } from './validations';

interface Props {
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
    <Card
      sx={{
        boxShadow: 'none',
        border: 'none',
        height: '100%',
        width: '100%',
        overflow: 'scroll',
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ backgroundColor: (t) => t.palette.primary.main }}>
            <AddIcon />
          </Avatar>
        }
        title={
          <Typography variant="h5">
            {isCreateMode ? 'Add a Slackline Group' : 'Edit Slackline Group'}
          </Typography>
        }
      />
      <CardContent component={Stack} spacing={1}>
        <Stack spacing={1}>
          {props.mapErrors?.map((e) => (
            <Alert key={e} severity="error">
              {e}
            </Alert>
          ))}
        </Stack>
        <form onSubmit={formik.handleSubmit}>
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

            <Button
              color="primary"
              variant="contained"
              fullWidth
              type="submit"
              disabled={props.disableSubmit}
              loading={props.isSubmitting}
            >
              Submit
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
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
