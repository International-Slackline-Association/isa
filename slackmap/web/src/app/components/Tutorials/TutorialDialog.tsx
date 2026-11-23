import { useState } from 'react';

import { Button, Stack } from '@mui/material';

import { Carousel } from 'app/components/Carousel';
import { PopupDialog } from 'app/components/Dialogs/PopupDialog';
import { useCarouselIndex } from 'utils/hooks/useCarouselIndex';

interface Props {
  pages: React.JSX.Element[];
  onClose: () => void;
  closeText?: string;
}

export const TutorialDialog = (props: Props) => {
  const [isOpen, setIsOpen] = useState(props.pages.length > 0);
  const { carouselIndex, setCarouselIndex, isOnLastIndex } = useCarouselIndex(props.pages.length);

  const close = () => {
    setIsOpen(false);
    props.onClose();
  };

  return (
    <PopupDialog open={isOpen} onClose={close} width={460}>
      <Carousel indicators cycleNavigation={false} swipe={false} index={carouselIndex} onChange={setCarouselIndex}>
        {props.pages}
      </Carousel>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Button onClick={close}>Skip</Button>
        <Button variant="contained" onClick={() => (isOnLastIndex ? close() : setCarouselIndex(carouselIndex + 1))}>
          {isOnLastIndex ? props.closeText || 'Done' : 'Next'}
        </Button>
      </Stack>
    </PopupDialog>
  );
};
