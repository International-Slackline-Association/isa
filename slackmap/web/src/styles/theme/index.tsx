import type {} from '@mui/lab/themeAugmentation';
import { Shadows, Theme, createTheme } from '@mui/material';

import { brand } from './brand';
import { palette } from './palette';
import { radius, shadow, ui } from './ui';

const font = brand('isa-font-family-body');
const heading = { fontFamily: font, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 };

export const theme: Theme = createTheme({
  palette,
  shape: { borderRadius: radius.field },
  shadows: ['none', ...Array(24).fill(shadow.float)] as Shadows,
  typography: {
    fontFamily: font,
    fontSize: 14,
    h1: { ...heading, fontSize: 32 },
    h2: { ...heading, fontSize: 28 },
    h3: { ...heading, fontSize: 24 },
    h4: { ...heading, fontSize: 21 },
    h5: { ...heading, fontSize: 18 },
    h6: { ...heading, fontSize: 16 },
    subtitle1: { fontWeight: 600, fontSize: 15 },
    subtitle2: { fontWeight: 600, fontSize: 13.5 },
    body1: { fontSize: 14.5, lineHeight: 1.45 },
    body2: { fontSize: 13.5, lineHeight: 1.4 },
    body2Bold: { fontSize: 13.5, lineHeight: 1.4, fontWeight: 600 },
    caption: { fontSize: 12.5, lineHeight: 1.35 },
    overline: { fontSize: 12.5, fontWeight: 500, letterSpacing: 0, textTransform: 'none', lineHeight: 1.4 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' } },
    },
    MuiTypography: {
      defaultProps: { variantMapping: { body2Bold: 'p' } },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'text' },
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          minHeight: 36,
          padding: '0 16px',
          fontSize: 14,
          whiteSpace: 'nowrap',
        },
        sizeSmall: { minHeight: 30, padding: '0 12px', fontSize: 13 },
        sizeLarge: { minHeight: 42, padding: '0 20px', fontSize: 15 },
        text: { padding: '0 10px' },
        startIcon: { marginRight: 6 },
      },
      variants: [
        // An outlined button is the soft grey pill every secondary action uses.
        {
          props: { variant: 'outlined' },
          style: {
            border: 0,
            backgroundColor: ui.fill,
            color: ui.text,
            '&:hover': { border: 0, backgroundColor: ui.fillHover },
          },
        },
        {
          props: { variant: 'contained', color: 'error' },
          style: {
            backgroundColor: ui.dangerTint,
            color: ui.danger,
            '&:hover': { backgroundColor: '#F8DCD7' },
          },
        },
        {
          props: { variant: 'outlined', color: 'error' },
          style: {
            backgroundColor: ui.dangerTint,
            color: ui.danger,
            '&:hover': { backgroundColor: '#F8DCD7' },
          },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: radius.pill } },
    },
    MuiFab: {
      defaultProps: { color: 'primary' },
      styleOverrides: { root: { boxShadow: shadow.float } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: radius.card } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: radius.card } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radius.card, boxShadow: shadow.float, margin: 16, padding: 4 },
      },
    },
    MuiBackdrop: {
      styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: ui.backdrop } } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', padding: '16px 16px 4px' } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '8px 16px' } },
    },
    MuiDialogContentText: {
      styleOverrides: { root: { color: ui.muted } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 16px 16px', gap: 8, '& > :not(style) ~ :not(style)': { marginLeft: 0 } } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 14, boxShadow: shadow.float, marginTop: 6 },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 9, minHeight: 36, fontSize: 14, fontWeight: 500, '&:hover': { backgroundColor: ui.fill } },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 32 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.pill, fontWeight: 500, fontSize: 13 },
        sizeSmall: { height: 24, fontSize: 12.5 },
        filled: { backgroundColor: ui.fill },
      },
      variants: [
        { props: { color: 'active' }, style: { backgroundColor: ui.active, color: ui.onActive, fontWeight: 600 } },
      ],
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: ui.toast, borderRadius: 8, fontSize: 12.5, fontWeight: 500, padding: '6px 10px' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, alignItems: 'center', fontSize: 13.5 },
      },
      variants: [
        { props: { variant: 'standard', severity: 'warning' }, style: { backgroundColor: ui.warningTint, color: ui.warningInk } },
        { props: { variant: 'standard', severity: 'error' }, style: { backgroundColor: ui.dangerTint, color: ui.danger } },
        { props: { variant: 'standard', severity: 'info' }, style: { backgroundColor: ui.blueTint, color: ui.blueDark } },
      ],
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.field,
          backgroundColor: ui.fill,
          fontSize: 14,
          // Under 16px, iPhone zooms the page in when a field gets focus.
          '@media (pointer: coarse)': { fontSize: 16 },
          transition: 'background-color 120ms, box-shadow 120ms',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent', borderWidth: 1.5 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
          '&.Mui-focused': { backgroundColor: '#fff', boxShadow: `0 0 0 3px ${ui.blueTint}` },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ui.blue, borderWidth: 1.5 },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: ui.danger },
          '&.Mui-disabled': { opacity: 0.6 },
        },
        input: { padding: '9.5px 12px' },
        multiline: { padding: '9.5px 12px' },
        notchedOutline: { '& legend': { display: 'none' }, top: 0 },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: { position: 'relative', transform: 'none', fontSize: 13, fontWeight: 500, color: ui.text, marginBottom: 4 },
        asterisk: { color: ui.danger },
      },
    },
    MuiFormLabel: {
      styleOverrides: { root: { '&.Mui-focused': { color: ui.text } } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 2, marginRight: 0, fontSize: 12.5 } },
    },
    MuiCheckbox: {
      defaultProps: { size: 'small' },
    },
    MuiFormControlLabel: {
      styleOverrides: { label: { fontSize: 14 } },
    },
    MuiSnackbarContent: {
      styleOverrides: { root: { borderRadius: radius.pill, backgroundColor: ui.toast } },
    },
    MuiAvatar: {
      styleOverrides: { colorDefault: { backgroundColor: ui.fill, color: ui.muted } },
    },
    MuiBadge: {
      styleOverrides: { badge: { fontWeight: 600 } },
    },
    MuiTimelineDot: {
      styleOverrides: {
        root: { boxShadow: 'none', padding: 5, margin: '6px 0', backgroundColor: ui.fill, color: ui.muted, '& .MuiSvgIcon-root': { fontSize: 14 } },
      },
    },
    MuiTimelineConnector: {
      styleOverrides: { root: { backgroundColor: ui.line, width: 1.5 } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: ui.line } },
    },
  },
});
