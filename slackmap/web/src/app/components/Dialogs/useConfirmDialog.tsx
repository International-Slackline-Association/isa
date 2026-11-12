import React, { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface Props {
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<Props | null>(null);

  const ConfirmDialog: React.FC = () => (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      sx={{
        backdropFilter: 'blur(2px)',
      }}
    >
      <DialogTitle> {dialogProps?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{dialogProps?.description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setIsOpen(false);
          }}
        >
          {'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setIsOpen(false);
            dialogProps?.onConfirm();
          }}
        >
          {dialogProps?.confirmText || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const showConfirmDialog = (props: Props) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  return { ConfirmDialog, showConfirmDialog };
};
