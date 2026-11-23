import { useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, ButtonBase, Dialog, IconButton, Stack, ThemeProvider, Typography } from '@mui/material';

import { appColors } from 'styles/theme/colors';
import { panelSurface, panelTheme } from 'styles/theme/panelTheme';

import { AnonymousDrawing, NamedDrawing, slides } from './drawings';

export type ActivationMode = 'anonymous' | 'named';

interface Props {
  open: boolean;
  lineName: string;
  // Set when this browser holds no anonymous pass: why the Anonymous choice is unavailable.
  anonymousUnavailable?: string;
  onClose: () => void;
  onChoose: (mode: ActivationMode) => void;
}

const tileSx = {
  flex: 1,
  flexDirection: 'column',
  gap: 0.5,
  p: 1.25,
  pb: 1.5,
  borderRadius: 4,
  bgcolor: '#16263a',
  border: '1.5px solid rgba(255,255,255,.1)',
  color: 'text.primary',
  textAlign: 'center',
  transition: 'border-color .15s, transform .15s',
  '&:hover': { borderColor: appColors.slackmapBlue, transform: 'translateY(-2px)' },
  '&.Mui-disabled': { opacity: 0.45 },
} as const;

const Choice = (props: {
  drawing: React.ReactNode;
  title: string;
  line: string;
  tag?: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <ButtonBase sx={tileSx} disabled={props.disabled} onClick={props.onClick}>
    {props.drawing}
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, letterSpacing: '.05em', color: appColors.slackmapGreen, visibility: props.tag ? 'visible' : 'hidden' }}
    >
      {props.tag ?? '·'}
    </Typography>
    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{props.title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.25 }}>
      {props.line}
    </Typography>
  </ButtonBase>
);

const Carousel = (props: { onBack: () => void }) => {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;
  const go = (next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  let startX: number | undefined;
  return (
    <Stack spacing={1.5}>
      <Button size="small" onClick={props.onBack} sx={{ alignSelf: 'flex-start', color: 'text.secondary', px: 0 }}>
        ‹ Back to the choice
      </Button>
      <Box
        sx={{ textAlign: 'center', touchAction: 'pan-y' }}
        onPointerDown={(e) => (startX = e.clientX)}
        onPointerUp={(e) => {
          if (startX === undefined) return;
          const dx = e.clientX - startX;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {slide.drawing}
        <Typography sx={{ fontSize: 30, lineHeight: 1, mt: 0.5 }}>{slide.emoji}</Typography>
        <Typography sx={{ mt: 0.75, fontSize: 16, lineHeight: 1.35, minHeight: 66, '& b': { color: '#fff' } }}>
          {slide.text}
        </Typography>
        {slide.link && (
          <Button href={slide.link.href} target="_blank" rel="noreferrer" size="small" sx={{ mt: 1, color: '#8ec0ec' }}>
            {slide.link.label} ↗
          </Button>
        )}
        {slide.aside && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'inline-block', mt: 1, px: 1.25, py: 0.25, borderRadius: 999, bgcolor: 'rgba(255,255,255,.06)' }}
          >
            {slide.aside}
          </Typography>
        )}
      </Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Button onClick={() => go(index - 1)} sx={{ color: 'text.secondary', visibility: index ? 'visible' : 'hidden' }}>
          ‹ Back
        </Button>
        <Stack direction="row" spacing={0.875}>
          {slides.map((_, i) => (
            <Box
              key={i}
              component="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              sx={{
                width: i === index ? 22 : 9,
                height: 9,
                p: 0,
                border: 0,
                borderRadius: 6,
                cursor: 'pointer',
                bgcolor: i === index ? appColors.slackmapGreen : 'rgba(255,255,255,.22)',
              }}
            />
          ))}
        </Stack>
        <Button variant="contained" onClick={last ? props.onBack : () => go(index + 1)}>
          {last ? 'Choose now' : 'Next ›'}
        </Button>
      </Stack>
    </Stack>
  );
};

export const ActivateDialog = (props: Props) => {
  const [explaining, setExplaining] = useState(false);
  useEffect(() => {
    if (props.open) setExplaining(false);
  }, [props.open]);

  return (
    <ThemeProvider theme={panelTheme}>
      <Dialog
        open={props.open}
        onClose={props.onClose}
        slotProps={{
          paper: { sx: { bgcolor: panelSurface, borderRadius: 5, p: 2.25, m: 1.5, width: 460, maxWidth: 'calc(100% - 24px)' } },
          backdrop: { sx: { bgcolor: 'rgba(8,14,22,.5)' } },
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={props.onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,.08)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        {explaining ? (
          <Carousel onBack={() => setExplaining(false)} />
        ) : (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: 19, pr: 4 }}>Activate {props.lineName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75 }}>
              Show it as rigged now, for whoever needs to know. You stay out of it.
            </Typography>
            <Stack direction="row" spacing={1.25}>
              <Choice
                drawing={<AnonymousDrawing />}
                title="Anonymous"
                line={props.anonymousUnavailable ?? 'SlackMap can’t know it’s you'}
                disabled={Boolean(props.anonymousUnavailable)}
                onClick={() => props.onChoose('anonymous')}
              />
              <Choice
                drawing={<NamedDrawing />}
                title="With my name"
                line="Your name shows on the line"
                onClick={() => props.onChoose('named')}
              />
            </Stack>
            <Button onClick={() => setExplaining(true)} sx={{ mt: 1.75, alignSelf: 'center', color: '#8ec0ec' }}>
              💡 How does this work?
            </Button>
          </>
        )}
      </Dialog>
    </ThemeProvider>
  );
};
