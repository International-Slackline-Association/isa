import React, { useState } from 'react';

import { Box } from '@mui/material';

import { PopupDialog } from './PopupDialog';

interface Props {
  title: string;
  description: string | React.ReactNode;
}

export const useInfoDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<Props | null>(null);

  const InfoDialog: React.FC = () => (
    <PopupDialog open={isOpen} onClose={() => setIsOpen(false)} title={dialogProps?.title} width={560}>
      <Box sx={{ color: 'text.secondary', fontSize: 14 }}>{dialogProps?.description}</Box>
    </PopupDialog>
  );

  const showInfoDialog = (props: Props) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  return { InfoDialog, showInfoDialog };
};
