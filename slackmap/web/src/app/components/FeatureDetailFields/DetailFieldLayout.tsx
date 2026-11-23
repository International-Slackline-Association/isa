import React from 'react';

import { Box, Stack, Typography, styled } from '@mui/material';

interface Props {
  icon: React.ReactNode;
  header: string | React.ReactNode;
  subHeader?: string | React.ReactNode;
  children?: React.ReactNode;
}

export const FeatureDetailFieldLayout = styled((props: Props) => {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', '& > .MuiSvgIcon-root': { fontSize: 16, color: 'text.secondary' } }}>
        {props.icon}
        {typeof props.header === 'string' ? (
          <Typography variant="subtitle2" component="h3">
            {props.header}
          </Typography>
        ) : (
          props.header
        )}
      </Stack>
      {props.subHeader &&
        (typeof props.subHeader === 'string' ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {props.subHeader}
          </Typography>
        ) : (
          <Box sx={{ '.MuiTypography-root': { fontSize: 12.5 } }}>{props.subHeader}</Box>
        ))}
      {props.children}
    </Stack>
  );
})();
