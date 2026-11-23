import React, { ChangeEventHandler, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
} from '@mui/material';

import { selectUserInfo } from 'app/slices/app/selectors';
import { uploadData } from 'aws-amplify/storage';
import { imageUrlFromS3Key, showErrorNotification } from 'utils';

export interface S3PhotoMeta {
  s3Key: string;
  isInProcessingBucket?: boolean;
  id: string;
  isCover?: boolean;
}

interface PhotoMeta extends S3PhotoMeta {
  srcFile?: File;
}

interface Props {
  htmlId?: string;
  photos?: S3PhotoMeta[];
  onPhotosChanged?: (photos: S3PhotoMeta[]) => void;
  maxPhotoCount: number;
  disableCoverPhoto?: boolean;
}

// No HEIC: without it in `accept`, iOS converts photos to JPEG; the server cannot read HEIC.
const allowedFileTypes = ['image/jpg', 'image/png', 'image/jpeg', 'image/webp'];

export const S3ImageList = (props: Props) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const dispatch = useDispatch();

  const userInfo = useSelector(selectUserInfo);

  const [images, setImages] = React.useState<PhotoMeta[]>(props.photos ?? []);

  const updateImages = (s3Key: string, id: string, file: File | undefined) => {
    const index = images.findIndex((i) => i.id === id);
    if (index === -1) {
      setImages([...images, { s3Key, id, isInProcessingBucket: true, srcFile: file }]);
    } else if (!file) {
      setImages(images.filter((i) => i.id !== id));
    }
  };

  const onImageChange: ChangeEventHandler<any> = async (e) => {
    if (e.target.files) {
      const file = e.target.files[0] as File;
      if (file) {
        if (!allowedFileTypes.includes(file.type)) {
          dispatch(
            showErrorNotification(`Allowed image types are: ${allowedFileTypes.join(', ')}`),
          );
          e.target.value = null;
          return;
        }

        setIsUploadingImage(true);
        const { key, id } = generateS3Key(file.type);
        uploadData({
          key,
          data: file,
          options: {
            accessLevel: 'guest',
            contentType: file.type,
          },
        })
          .result.then(() => {
            setIsUploadingImage(false);
            updateImages(`public/${key}`, id, file);
          })
          .catch((error) => {
            console.error(error);
            setIsUploadingImage(false);
            dispatch(
              showErrorNotification(
                'Uploading failed for unknown reason: Try with a smaller image file please',
              ),
            );
          })
          .finally(() => {
            e.target.value = null;
          });
      }
    }
  };

  const deletePhotoClicked = (id: string) => {
    setImages(images.filter((i) => i.id !== id));
  };

  const makeCoverPhotoClicked = (id: string) => {
    setImages(images.map((i) => ({ ...i, isCover: i.id === id })));
  };

  const generateS3Key = (imageType: string) => {
    const folder = userInfo?.isaId ?? `anonymous`;
    const ext = imageType.split('/')[1];
    const randomId = Math.random().toString(36).substring(2, 8);
    return {
      key: `slackmap/${folder}/${randomId}.${ext}`,
      id: randomId,
    };
  };

  useEffect(() => {
    const strippedImages = images.map((i) => {
      const { srcFile, ...strippedImage } = i;
      return strippedImage;
    });
    props.onPhotosChanged?.(strippedImages);
  }, [images]);

  return (
    <ImageList variant="standard" cols={1} gap={8} sx={{ width: '100%', m: 0, '& .MuiImageListItem-root': { borderRadius: '12px', overflow: 'hidden' } }}>
      {images
        .filter((i) => i.s3Key)
        .map((item) => (
          <ImageListItem key={item.s3Key}>
            {item.srcFile ? (
              <img src={URL.createObjectURL(item.srcFile)} alt={''} />
            ) : (
              <img src={imageUrlFromS3Key(item.s3Key)} alt={''} loading="lazy" />
            )}
            <ImageListItemBar
              actionIcon={
                <Stack direction={'row'} spacing={1}>
                  {!props.disableCoverPhoto && (
                    <Button
                      sx={{
                        color: 'white',
                        display: item.isCover ? 'none' : 'block',
                      }}
                      size="small"
                      onClick={() => makeCoverPhotoClicked(item.id!)}
                    >
                      Set as cover
                    </Button>
                  )}

                  <IconButton sx={{ color: 'white' }} onClick={() => deletePhotoClicked(item.id!)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            />
          </ImageListItem>
        ))}

      {images.length < (props.maxPhotoCount ?? 4) && (
        <>
          <Box
            component="label"
            htmlFor={`upload-photo-${props.htmlId}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              height: 64,
              borderRadius: '12px',
              bgcolor: 'neutral.main',
              color: 'text.secondary',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 120ms',
              '&:hover': { bgcolor: 'neutral.dark', color: 'text.primary' },
            }}
          >
            <AddPhotoAlternateOutlinedIcon fontSize="small" />
            {isUploadingImage ? 'Uploading…' : 'Add a photo'}
          </Box>
          <input
            id={`upload-photo-${props.htmlId}`}
            type="file"
            accept={allowedFileTypes.join(', ')}
            style={{ display: 'none' }}
            onChange={onImageChange}
          />
        </>
      )}
    </ImageList>
  );
};
