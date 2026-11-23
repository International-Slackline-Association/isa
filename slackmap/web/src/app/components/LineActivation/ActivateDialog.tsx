import { useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';

import { PopupDialog } from 'app/components/Dialogs/PopupDialog';
import { ui } from 'styles/theme/ui';

import { AnonymousDrawing, NamedDrawing, slides } from './drawings';

export type ActivationMode = 'anonymous' | 'named';

interface Props {
  open: boolean;
  featureName: string;
  anonymousUnavailable?: string;
  onClose: () => void;
  onChoose: (mode: ActivationMode) => void;
}

const Choice = (props: {
  drawing: React.ReactNode;
  title: string;
  line: string;
  tag?: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <ButtonBase
    disabled={props.disabled}
    onClick={props.onClick}
    sx={{
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 0.25,
      p: 1.25,
      pb: 1.5,
      borderRadius: '14px',
      border: `1.5px solid ${ui.line}`,
      textAlign: 'center',
      transition: 'border-color 120ms, background-color 120ms',
      '&:hover': { borderColor: ui.blue, bgcolor: ui.blueTint },
      '&.Mui-disabled': { opacity: 0.5 },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>{props.drawing}</Box>
    <Typography variant="caption" sx={{ fontWeight: 600, color: ui.blue, visibility: props.tag ? 'visible' : 'hidden' }}>
      {props.tag ?? '·'}
    </Typography>
    <Typography variant="subtitle1">{props.title}</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {props.line}
    </Typography>
  </ButtonBase>
);

const HowItWorks = (props: { onBack: () => void }) => {
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
        <Typography sx={{ mt: 1.25, fontSize: 15, lineHeight: 1.4, minHeight: 64, '& b': { fontWeight: 600 } }}>
          {slide.text}
        </Typography>
        {slide.link && (
          <Button href={slide.link.href} target="_blank" rel="noreferrer" size="small" sx={{ mt: 0.5 }}>
            {slide.link.label} ↗
          </Button>
        )}
        {slide.aside && (
          <Typography
            variant="caption"
            component="p"
            sx={{ display: 'inline-block', mt: 1, px: 1.25, py: 0.25, borderRadius: 999, bgcolor: ui.fill, color: 'text.secondary' }}
          >
            {slide.aside}
          </Typography>
        )}
      </Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Button onClick={index ? () => go(index - 1) : props.onBack} startIcon={<ArrowBackIcon />}>
          {index ? 'Back' : 'The choice'}
        </Button>
        <Stack direction="row" spacing={0.75}>
          {slides.map((_, i) => (
            <Box
              key={i}
              component="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              sx={{
                width: i === index ? 20 : 8,
                height: 8,
                p: 0,
                border: 0,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'width 150ms',
                bgcolor: i === index ? ui.blue : ui.line,
              }}
            />
          ))}
        </Stack>
        <Button variant="contained" onClick={last ? props.onBack : () => go(index + 1)}>
          {last ? 'Choose now' : 'Next'}
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
    <PopupDialog
      open={props.open}
      onClose={props.onClose}
      width={440}
      title={explaining ? 'How does this work?' : `Activate ${props.featureName}`}
      description={!explaining && 'Show it as rigged now, for whoever needs to know. You stay out of it.'}
    >
      {explaining ? (
        <HowItWorks onBack={() => setExplaining(false)} />
      ) : (
        <>
          <Stack direction="row" spacing={1.25}>
            <Choice
              drawing={<AnonymousDrawing />}
              tag="Default"
              title="Anonymous"
              line={props.anonymousUnavailable ?? 'SlackMap can’t know it’s you'}
              disabled={Boolean(props.anonymousUnavailable)}
              onClick={() => props.onChoose('anonymous')}
            />
            <Choice
              drawing={<NamedDrawing />}
              title="With my name"
              line="Your name shows on it"
              onClick={() => props.onChoose('named')}
            />
          </Stack>
          <Button onClick={() => setExplaining(true)} sx={{ alignSelf: 'center' }}>
            How does this work?
          </Button>
        </>
      )}
    </PopupDialog>
  );
};
