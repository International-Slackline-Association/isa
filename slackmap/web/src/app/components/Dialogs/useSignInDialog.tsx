import React, { useState } from 'react';

import Button from '@mui/material/Button';

import { ResumeAction, signIn } from 'app/signIn';
import isaLogo from 'isa-brand/logos/isa-wide/isa-wide-color.svg';

import { PopupDialog } from './PopupDialog';

type Target = { to?: string; resume?: ResumeAction };

export const useSignInDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<Target>({});

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
        <Button variant="contained" onClick={() => signIn(target)}>
          Sign in or sign up
        </Button>
      }
    />
  );

  const showSignInDialog = (afterSignIn: Target = {}) => {
    setTarget(afterSignIn);
    setIsOpen(true);
  };

  return { SignInDialog, showSignInDialog };
};
