import React from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Stack, ThemeProvider, Typography } from '@mui/material';

import { theme } from 'styles/theme';
import { safeArea, ui } from 'styles/theme/ui';

export const PopupDialog = (props: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  image?: React.ReactNode;
  tone?: 'blue' | 'danger';
  actions?: React.ReactNode;
  width?: number;
  centered?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}) => (
  // In the base theme, so a pop-up opened from the blue panel is white like every other.
  <ThemeProvider theme={theme}>
    <Dialog
      open={props.open}
      onClose={props.onClose}
      sx={{ '& .MuiDialog-container': { alignItems: { xs: 'flex-end', lg: 'center' } } }}
      slotProps={{
        paper: {
          ...(props.onSubmit && { component: 'form', onSubmit: props.onSubmit }),
          sx: {
            m: { xs: 0, lg: 2 },
            p: 0,
            width: { xs: '100%', lg: props.width ?? 420 },
            maxWidth: { xs: '100%', lg: 'calc(100% - 32px)' },
            maxHeight: { xs: '92%', lg: 'calc(100% - 32px)' },
            borderRadius: { xs: '18px 18px 0 0', lg: '16px' },
            pb: { xs: safeArea.bottom, lg: 0 },
          },
        } as object,
      }}
    >
      <Box sx={{ display: { lg: 'none' }, width: 36, height: 4, borderRadius: 2, bgcolor: ui.line, mx: 'auto', mt: 1 }} />
      <IconButton
        aria-label="Close"
        onClick={props.onClose}
        size="small"
        sx={{ position: 'absolute', zIndex: 1, top: { xs: 14, lg: 12 }, right: 12, width: 30, height: 30, bgcolor: ui.fill, '&:hover': { bgcolor: ui.fillHover } }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Stack spacing={1.5} sx={{ p: 2, pt: { xs: 1.5, lg: 2 }, overflowY: 'auto', textAlign: props.centered ? 'center' : 'left' }}>
        {props.image && <Box sx={{ display: 'flex', justifyContent: props.centered ? 'center' : 'flex-start', pt: 1 }}>{props.image}</Box>}
        {(props.icon || props.title || props.description) && (
          <Box sx={{ pr: props.centered ? 0 : 4 }}>
            {props.icon && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  mb: 1.25,
                  mx: props.centered ? 'auto' : 0,
                  bgcolor: props.tone === 'danger' ? ui.dangerTint : ui.blueTint,
                  color: props.tone === 'danger' ? ui.danger : ui.blue,
                  '& .MuiSvgIcon-root': { fontSize: 20 },
                }}
              >
                {props.icon}
              </Box>
            )}
            {props.title && (
              <Typography variant="h5" component="h2">
                {props.title}
              </Typography>
            )}
            {props.description && (
              <Typography variant="body2" component="div" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {props.description}
              </Typography>
            )}
          </Box>
        )}
        {props.children}
        {props.actions && (
          <Stack direction="row" spacing={1} sx={{ pt: 0.5, '& > *': { flex: 1 } }}>
            {props.actions}
          </Stack>
        )}
      </Stack>
    </Dialog>
  </ThemeProvider>
);
