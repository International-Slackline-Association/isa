import { Alert, AlertColor, AlertTitle, Box } from '@mui/material';

import { SlacklineRestrictionLevel } from '@server/core/types';
import { trimString } from 'utils';

interface Props {
  level?: SlacklineRestrictionLevel;
  restrictionInfo?: string;
  trimLength?: number;
}

export const FeatureDetailRestrictionField = (props: Props) => {
  let severity: AlertColor | undefined;
  let warningText: string | undefined;
  if (!props.level) {
    return null;
  }
  switch (props.level) {
    case 'partial':
      severity = 'warning';
      warningText = 'Partially restricted access';
      break;
    case 'full':
      severity = 'error';
      warningText = 'Fully restricted access';
      break;
    default:
      break;
  }
  if (!severity) {
    return null;
  }
  return (
    <Box>
      <Alert severity={severity}>
        <AlertTitle sx={{ fontWeight: 600, fontSize: 13.5, mb: 0.25 }}>{warningText}</AlertTitle>
        {trimString(props.restrictionInfo, props.trimLength)}
      </Alert>
    </Box>
  );
};
