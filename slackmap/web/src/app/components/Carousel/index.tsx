import { useRef } from 'react';
import { keyframes } from '@mui/material/styles';

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Box, IconButton, SxProps, Theme } from '@mui/material';

interface Props {
  children: React.ReactNode[];
  index: number;
  onChange: (index: number) => void;
  indicators?: boolean;
  cycleNavigation?: boolean;
  swipe?: boolean;
  sx?: SxProps<Theme>;
}

const slideFrom = (offset: string) =>
  keyframes`from { transform: translateX(${offset}); opacity: 0.4; } to { transform: none; opacity: 1; }`;
const slideFromRight = slideFrom('40%');
const slideFromLeft = slideFrom('-40%');

const navButtonSx: SxProps<Theme> = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  backgroundColor: '#494949',
  color: 'white',
  transition: '200ms',
  '&:hover': { backgroundColor: '#494949', opacity: 0.6 },
};

export const Carousel = ({
  children,
  index,
  onChange,
  indicators = false,
  cycleNavigation = true,
  swipe = true,
  sx,
}: Props) => {
  const count = children.length;
  const touchStartX = useRef<number | null>(null);
  const previousIndex = useRef(index);
  const forward = index >= previousIndex.current;
  previousIndex.current = index;

  const go = (next: number) => {
    if (cycleNavigation) onChange((next + count) % count);
    else if (next >= 0 && next < count) onChange(next);
  };
  const canPrev = cycleNavigation || index > 0;
  const canNext = cycleNavigation || index < count - 1;

  return (
    <Box sx={sx}>
      <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
        <Box
          key={index}
          sx={{
            animation: `${forward ? slideFromRight : slideFromLeft} 300ms ease`,
            touchAction: 'pan-y pinch-zoom',
          }}
          onTouchStart={(e) => {
            if (swipe && e.touches.length === 1) touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? index + 1 : index - 1);
          }}
        >
          {children[index]}
        </Box>
        {count > 1 && canPrev && (
          <IconButton aria-label="Previous" sx={{ ...navButtonSx, left: 10 }} onClick={() => go(index - 1)}>
            <NavigateBeforeIcon />
          </IconButton>
        )}
        {count > 1 && canNext && (
          <IconButton aria-label="Next" sx={{ ...navButtonSx, right: 10 }} onClick={() => go(index + 1)}>
            <NavigateNextIcon />
          </IconButton>
        )}
      </Box>
      {indicators && count > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          {children.map((_, i) => (
            <IconButton
              key={i}
              size="small"
              aria-label={`carousel indicator ${i + 1}`}
              onClick={() => onChange(i)}
              sx={{ p: '2px', color: i === index ? '#494949' : '#afafaf' }}
            >
              <FiberManualRecordIcon sx={{ fontSize: 15 }} />
            </IconButton>
          ))}
        </Box>
      )}
    </Box>
  );
};
