import React from 'react';

import { Avatar, Box, ButtonBase, Stack, Typography } from '@mui/material';

export const flagUrl = (countryCode: string) =>
  `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;

export const SectionTitle = (props: { title: string; count?: number }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 2, mb: 0.5 }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}
    >
      {props.title}
    </Typography>
    {props.count !== undefined && (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {props.count}
      </Typography>
    )}
  </Stack>
);

export const PanelRow = (props: {
  title: React.ReactNode;
  subtitle?: string;
  accent?: string;
  icon?: React.ReactNode;
  flag?: string;
  trailing?: string;
  multiline?: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
}) => (
  <ButtonBase
    onClick={() => {
      props.onHover?.(false);
      props.onClick();
    }}
    onMouseEnter={() => props.onHover?.(true)}
    onMouseLeave={() => props.onHover?.(false)}
    sx={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      py: 0.75,
      px: 1,
      my: 0.25,
      borderRadius: 2,
      textAlign: 'left',
      transition: 'background-color 120ms',
      '&:hover': { backgroundColor: 'action.hover' },
    }}
  >
    {props.accent && (
      <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 1, bgcolor: props.accent, flexShrink: 0 }} />
    )}
    {props.icon && (
      <Avatar
        sx={{ width: 26, height: 26, bgcolor: 'action.selected', color: 'text.secondary', '& svg': { fontSize: '0.9rem' } }}
      >
        {props.icon}
      </Avatar>
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        component="div"
        sx={{
          fontWeight: props.multiline ? 400 : 600,
          color: 'text.primary',
          '& b': { fontWeight: 600 },
          fontSize: '0.8rem',
          ...(props.multiline
            ? {}
            : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
        }}
      >
        {props.title}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        {props.flag && (
          <Avatar src={flagUrl(props.flag)} sx={{ width: 12, height: 12, bgcolor: 'transparent' }} />
        )}
        {props.subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {props.subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
    {props.trailing && (
      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        {props.trailing}
      </Typography>
    )}
  </ButtonBase>
);
