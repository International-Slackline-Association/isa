import React, { useState } from 'react';

import { Button, TextField } from '@mui/material';

import { PopupDialog } from './PopupDialog';

interface ConfirmDialogProps {
  title: string;
  description: string;
  textBoxLabel: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (text: string) => void;
  onCancel?: () => void;
}

export const useTextBoxDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps | null>(null);

  const TextBoxDialog: React.FC = () => {
    const [text, setText] = useState('');
    const cancel = () => {
      setIsOpen(false);
      dialogProps?.onCancel?.();
    };

    return (
      <PopupDialog
        open={isOpen}
        onClose={cancel}
        width={480}
        title={dialogProps?.title}
        description={dialogProps?.description}
        onSubmit={(event) => {
          event.preventDefault();
          dialogProps?.onConfirm(text);
          setIsOpen(false);
        }}
        actions={
          <>
            <Button variant="outlined" onClick={cancel}>
              {dialogProps?.cancelText || 'Cancel'}
            </Button>
            <Button type="submit" variant="contained" disabled={text.length <= 5}>
              {dialogProps?.confirmText || 'Confirm'}
            </Button>
          </>
        }
      >
        <TextField
          autoFocus
          required
          name="text"
          label={dialogProps?.textBoxLabel}
          multiline
          minRows={3}
          fullWidth
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </PopupDialog>
    );
  };

  const showTextBoxDialog = (props: ConfirmDialogProps) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  return { TextBoxDialog, showTextBoxDialog };
};
