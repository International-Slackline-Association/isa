import React, { useState } from 'react';

import Button from '@mui/material/Button';

import { PopupDialog } from './PopupDialog';

interface Props {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<Props | null>(null);

  const ConfirmDialog: React.FC = () => (
    <PopupDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title={dialogProps?.title}
      description={dialogProps?.description}
      actions={
        <>
          <Button variant="outlined" onClick={() => setIsOpen(false)}>
            {dialogProps?.cancelText || 'Cancel'}
          </Button>
          <Button
            variant="contained"
            color={dialogProps?.destructive ? 'error' : 'primary'}
            onClick={() => {
              setIsOpen(false);
              dialogProps?.onConfirm();
            }}
          >
            {dialogProps?.confirmText || 'Confirm'}
          </Button>
        </>
      }
    />
  );

  const showConfirmDialog = (props: Props) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  return { ConfirmDialog, showConfirmDialog };
};
