import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router';

import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Menu, MenuItem } from '@mui/material';

import { featureApi } from 'app/api/feature-api';
import { useConfirmDialog } from 'app/components/Dialogs/useConfirmDialog';
import { selectIsUserSignedIn } from 'app/slices/app/selectors';

import { useTextBoxDialog } from '../Dialogs/useTextBoxDialog';

interface Props {
  editorPermissions:
    | {
        canDelete: boolean;
        canEdit: boolean;
        canRequestEdit?: boolean;
      }
    | undefined;
  feature: {
    id: string;
    type: SlacklineMapFeatureType;
  };
  onRefreshClick: () => void;
}

export const FeatureMenuActions = (props: Props) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);
  const navigate = useNavigate();
  const { ConfirmDialog, showConfirmDialog } = useConfirmDialog();
  const { TextBoxDialog, showTextBoxDialog } = useTextBoxDialog();
  const isSignedIn = useSelector(selectIsUserSignedIn);
  const [searchParams] = useSearchParams();

  const [requestEditorship] = featureApi.useRequestTemporaryEditorshipMutation();
  const [deleteFeature, { isSuccess: isDeleted }] = featureApi.useDeleteFeatureMutation();
  const [sendDeleteFeatureRequest] = featureApi.useDeleteFeatureRequestMutation();

  const isGroup = props.feature.type === 'group';
  const closePath = isGroup ? '/communities' : '/';
  const editPath = isGroup
    ? `/communities/group/${props.feature.id}/edit`
    : `/${props.feature.type}/${props.feature.id}/edit`;

  useEffect(() => {
    if (isDeleted) {
      navigate({ pathname: closePath, search: searchParams.toString() });
    }
  }, [isDeleted]);

  const onEditClick = async () => {
    closeMenu();
    navigate(editPath);
  };

  const onDeleteClick = async () => {
    closeMenu();
    if (props.editorPermissions?.canDelete) {
      showConfirmDialog({
        title: `Delete this ${props.feature.type}?`,
        description:
          'Please confirm that you want to delete this feature. This action cannot be undone',
        onConfirm: () => deleteFeature({ id: props.feature.id, type: props.feature.type }),
      });
    } else {
      showTextBoxDialog({
        title: `Send a delete request`,
        description: `Only the owner of this ${props.feature.type} can delete it. Your name, email and reason are emailed to the owner and to the SlackMap team; the owner decides and may reply to you.`,
        textBoxLabel: 'Reason',
        confirmText: 'Send',
        onConfirm: (reason) => {
          sendDeleteFeatureRequest({
            id: props.feature.id,
            type: props.feature.type,
            payload: { reason },
          });
        },
      });
    }
  };

  const onRequestEditorshipClick = async () => {
    closeMenu();
    showConfirmDialog({
      title: 'Get Temporary Editor Permissions?',
      description:
        'You can get temporary permissions to edit this feature. The permissions will be revoked after 24 hours. All the edits you will make will be recorded in the history.',
      onConfirm: () => requestEditorship({ id: props.feature.id, type: props.feature.type }),
    });
  };

  const onCloseClicked = () => {
    navigate({ pathname: closePath, search: searchParams.toString() });
  };

  const onRefreshClicked = () => {
    closeMenu();
    props.onRefreshClick();
  };

  return (
    <>
      <ConfirmDialog />
      <TextBoxDialog />
      <IconButton onClick={onCloseClicked}>
        <CloseIcon />
      </IconButton>
      <IconButton aria-controls={menuAnchor ? 'cardHeaderMenu' : undefined}
        aria-haspopup="true"
        onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="cardHeaderMenu"
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        sx={{
          '& svg': {
            mr: 1,
            color: (t) => t.palette.primary.main,
          },
        }}
      >
        <MenuItem onClick={onRefreshClicked}>
          <RefreshIcon />
          Refresh
        </MenuItem>
        {props.feature.type !== 'country' && [
          props.editorPermissions?.canEdit ? (
            <MenuItem key="edit" onClick={onEditClick}>
              <EditIcon />
              Edit
            </MenuItem>
          ) : props.editorPermissions?.canRequestEdit === false && isSignedIn ? null : (
            <MenuItem key="request" onClick={onRequestEditorshipClick} disabled={!isSignedIn}>
              <ManageHistoryIcon />
              {isSignedIn ? 'Request to Edit' : 'Request to Edit(Sign-in)'}
            </MenuItem>
          ),
          <MenuItem key="delete" onClick={onDeleteClick} disabled={!isSignedIn}>
            <DeleteIcon />
            {isSignedIn ? 'Delete' : 'Delete(Sign-in)'}
          </MenuItem>,
        ]}
      </Menu>
    </>
  );
};
