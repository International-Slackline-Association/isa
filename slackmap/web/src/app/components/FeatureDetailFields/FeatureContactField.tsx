import CallIcon from '@mui/icons-material/Call';
import MailIcon from '@mui/icons-material/Mail';
import { Button, IconButton, Typography } from '@mui/material';

import { contactApi } from 'app/api/contact-api';

import { useTextBoxDialog } from '../Dialogs/useTextBoxDialog';
import { FeatureDetailFieldLayout } from './DetailFieldLayout';

interface Props {
  content?: string;
  contactUserId: string;
  feature: { id: string; type: 'line' | 'spot' };
}

export const ContactUserButton = (props: {
  contactUserId: string;
  // The server sends to the email in this feature's contact info, or else to its creator.
  feature?: { id: string; type: 'line' | 'spot' };
  noText?: boolean;
}) => {
  const { TextBoxDialog, showTextBoxDialog } = useTextBoxDialog();
  const [sendContactMessage] = contactApi.useSendUserMessageMutation();

  if (!props.contactUserId || props.contactUserId === 'unknown') {
    return null;
  }

  const onClick = () => {
    showTextBoxDialog({
      title: 'Contact User (Email)',
      description:
        'You can send a message to the user here and they will receive it as an Email. Don`t forget to include your contact information. Spam messages and the user will be blocked!',
      textBoxLabel: 'Message',
      confirmText: 'Send',
      onConfirm: (message) => {
        sendContactMessage({
          recipient: props.feature
            ? { type: 'featureContact', featureId: props.feature.id, featureType: props.feature.type }
            : { type: 'userId', userId: props.contactUserId },
          message,
          context_url: window.location.href,
        });
      },
    });
  };

  return (
    <>
      <TextBoxDialog />
      {props.noText ? (
        <IconButton size="small" color="primary" onClick={onClick}>
          <MailIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      ) : (
        <Button
          startIcon={<MailIcon />}
          size="small"
          color="primary"
          sx={{ alignSelf: 'flex-start' }}
          onClick={onClick}
        >
          Contact
        </Button>
      )}
    </>
  );
};

export const FeatureContactField = (props: Props) => {
  return (
    <FeatureDetailFieldLayout icon={<CallIcon fontSize="small" />} header={'Contact'}>
      {props.content && props.content.length > 0 ? (
        <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
          {props.content}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
          User has not provided any contact information!
        </Typography>
      )}
      <ContactUserButton contactUserId={props.contactUserId} feature={props.feature} />
    </FeatureDetailFieldLayout>
  );
};
