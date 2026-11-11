import React, { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

interface Props {
  title: string;
  content: React.ReactNode;
}

export const useDetailDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<Props | null>(null);

  const InfoDialog: React.FC = () => (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      sx={{
        backdropFilter: 'blur(2px)',
      }}
    >
      <DialogTitle sx={{ alignSelf: 'center' }}> {dialogProps?.title}</DialogTitle>
      <DialogContent>{dialogProps?.content}</DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const showInfoDialog = (props: Props) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  return { InfoDialog, showInfoDialog };
};
