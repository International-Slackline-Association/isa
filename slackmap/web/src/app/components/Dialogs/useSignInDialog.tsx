import React, { useState } from 'react';

import Button from '@mui/material/Button';

import { signInWithRedirect } from 'aws-amplify/auth';
import isaLogo from 'isa-brand/logos/isa-wide/isa-wide-color.svg';

import { PopupDialog } from './PopupDialog';

export const useSignInDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const SignInDialog: React.FC = () => (
    <PopupDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      width={380}
      centered
      image={<img src={isaLogo} alt="International Slackline Association" style={{ width: 200, maxWidth: '70%' }} />}
      title="Sign in to continue"
      description="SlackMap uses your ISA account. If you don't have one, creating it takes a few seconds."
      actions={
        <Button variant="contained" onClick={() => signInWithRedirect()}>
          Sign in or sign up
        </Button>
      }
    />
  );

  const showSignInDialog = () => {
    setIsOpen(true);
  };

  return { SignInDialog, showSignInDialog };
};
