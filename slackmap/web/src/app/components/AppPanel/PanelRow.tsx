import React from 'react';

import { Avatar, Box, ButtonBase, Stack, Typography } from '@mui/material';

import { ui } from 'styles/theme/ui';

export const flagUrl = (countryCode: string) =>
  `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;

export const ActiveDot = () => (
  <Box
    component="span"
    sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ui.active, boxShadow: `0 0 0 4px ${ui.activeRing}`, flexShrink: 0 }}
  />
);

export const SectionTitle = (props: { title: string; count?: number }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 1.75, mb: 0.5 }}
  >
    <Typography variant="caption" sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>
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
      gap: 1.25,
      py: 0.75,
      px: 0.75,
      my: 0.25,
      borderRadius: '12px',
      bgcolor: props.accent ? 'action.hover' : undefined,
      textAlign: 'left',
      transition: 'background-color 120ms',
      '&:hover': { backgroundColor: 'action.hover' },
    }}
  >
    {props.accent && (
      <Avatar sx={{ width: 28, height: 28, bgcolor: ui.onBlueFill }}>
        <ActiveDot />
      </Avatar>
    )}
    {props.icon && (
      <Avatar sx={{ width: 28, height: 28, bgcolor: ui.onBlueFill, color: 'text.primary', '& svg': { fontSize: 15 } }}>
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
          fontSize: 13.5,
          lineHeight: 1.3,
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
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
            {props.subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
    {props.trailing && (
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap' }}>
        {props.trailing}
      </Typography>
    )}
  </ButtonBase>
);
