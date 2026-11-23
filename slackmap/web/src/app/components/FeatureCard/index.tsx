import React, { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Avatar, Box, Button, IconButton, ListItemIcon, Menu, MenuItem, Stack, Typography } from '@mui/material';

import { LoadingIndicator } from 'app/components/LoadingIndicator';
import { shadow, ui } from 'styles/theme/ui';

export const FeatureCard = (props: {
  loading: boolean;
  image?: string;
  avatar?: React.ReactNode;
  title?: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  // [longitude, latitude]
  mapLink?: number[];
  children?: React.ReactNode;
}) => (
  <Box sx={{ height: '100%', width: '100%', overflowY: 'auto', bgcolor: 'background.paper', scrollbarWidth: 'thin' }}>
    {props.loading ? (
      <LoadingIndicator />
    ) : (
      <>
        {props.image && (
          <Box sx={{ position: 'relative', height: 150, bgcolor: ui.fill }}>
            <Box component="img" src={props.image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <Actions overImage>{props.actions}</Actions>
          </Box>
        )}
        <Stack spacing={1.5} sx={{ px: 2, pt: props.image ? 1.75 : 1.5, pb: 2 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            {props.avatar}
            <Box sx={{ flex: 1, minWidth: 0, pt: props.avatar ? 0.25 : 0 }}>
              <Typography variant="h4" component="h2" sx={{ wordBreak: 'break-word' }}>
                {props.title}
              </Typography>
              {props.tags && (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
                  {props.tags}
                </Stack>
              )}
            </Box>
            {!props.image && <Actions>{props.actions}</Actions>}
          </Stack>
          {props.children}
          {props.mapLink && (
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenInNewIcon sx={{ fontSize: '15px !important' }} />}
              href={`https://maps.google.com/maps?z=12&t=m&q=loc:${props.mapLink[1]}+${props.mapLink[0]}`}
              target="_blank"
              sx={{ alignSelf: 'flex-start' }}
            >
              Open in Google Maps
            </Button>
          )}
        </Stack>
      </>
    )}
  </Box>
);

const Actions = (props: { overImage?: boolean; children?: React.ReactNode }) => (
  <Stack
    direction="row-reverse"
    spacing={0.75}
    sx={{
      flexShrink: 0,
      ...(props.overImage && { position: 'absolute', top: 10, right: 10 }),
      '& .MuiIconButton-root': {
        width: 32,
        height: 32,
        bgcolor: props.overImage ? 'rgba(255, 255, 255, 0.94)' : ui.fill,
        boxShadow: props.overImage ? shadow.chip : 'none',
        color: ui.text,
        '&:hover': { bgcolor: props.overImage ? '#fff' : ui.fillHover },
      },
      '& .MuiSvgIcon-root': { fontSize: 18 },
    }}
  >
    {props.children}
  </Stack>
);

// A dot shows the map color it belongs to.
export const FeatureTag = (props: { label: React.ReactNode; dot?: string; color?: 'live' }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      height: 24,
      px: 1.125,
      borderRadius: 999,
      fontSize: 12.5,
      fontWeight: props.color ? 600 : 500,
      whiteSpace: 'nowrap',
      bgcolor: props.color === 'live' ? ui.live : ui.fill,
      color: props.color === 'live' ? ui.onLive : ui.text,
    }}
  >
    {props.dot && <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: props.dot }} />}
    {props.label}
  </Box>
);

export const FeatureStats = (props: { items: { value: React.ReactNode; label: string }[] }) => (
  <Stack direction="row" sx={{ '& > * + *': { borderLeft: `1px solid ${ui.line}`, pl: 1.75 } }}>
    {props.items.map((item) => (
      <Box key={item.label} sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>{item.value}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {item.label}
        </Typography>
      </Box>
    ))}
  </Stack>
);

export const CloseAndRefreshActions = (props: { onClose: () => void; onRefresh?: () => void }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton aria-label="Close" onClick={props.onClose}>
        <CloseIcon />
      </IconButton>
      {props.onRefresh && (
        <>
          <IconButton aria-label="More" aria-haspopup="true" onClick={(e) => setAnchor(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                props.onRefresh?.();
              }}
            >
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              Refresh
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
};

export const FlagAvatar = (props: { countryCode: string }) => (
  <Avatar
    src={`https://hatscripts.github.io/circle-flags/flags/${props.countryCode.toLowerCase()}.svg`}
    sx={{ width: 36, height: 36 }}
  >
    {props.countryCode}
  </Avatar>
);
