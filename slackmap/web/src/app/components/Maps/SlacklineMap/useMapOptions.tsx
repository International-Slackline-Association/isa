import { ReactNode, useState } from 'react';

import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import ForestIcon from '@mui/icons-material/Forest';
import GridViewIcon from '@mui/icons-material/GridView';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import PentagonIcon from '@mui/icons-material/Pentagon';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import SignpostIcon from '@mui/icons-material/Signpost';
import SensorsIcon from '@mui/icons-material/Sensors';
import {
  Box,
  Dialog,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import { SlacklineType, SpotType } from '@server/core/types';
import { SlacklineFeatureIcon } from 'app/components/Icons/SlacklineFeatureIcon';
import { useAppLocalStorage } from 'utils/hooks/useAppLocalStorage';
import { spotTypeOptions } from 'utils/spotTypes';

export type SelectedDisplayFeature = SlacklineMapFeatureType | 'all' | 'rigged';
export type SelectedMapStyle = 'default' | 'satellite' | 'outdoors' | 'streets';

const features: {
  key: SelectedDisplayFeature;
  label: string;
  icon: React.JSX.Element;
}[] = [
  {
    key: 'all',
    label: 'All',
    icon: <GridViewIcon fontSize="inherit" />,
  },
  {
    key: 'line',
    label: 'Lines',
    icon: <SlacklineFeatureIcon fontSize="inherit" />,
  },
  {
    key: 'spot',
    label: 'Spots',
    icon: <PentagonIcon fontSize="inherit" />,
  },
  {
    key: 'guide',
    label: 'Access Guides',
    icon: <FollowTheSignsIcon fontSize="inherit" />,
  },
  {
    key: 'rigged',
    label: 'Rigged now',
    icon: <SensorsIcon fontSize="inherit" />,
  },
];

const lineTypeFilterItems: {
  key: SlacklineType;
  label: string;
}[] = [
  {
    key: 'highline',
    label: 'Highline',
  },
  {
    key: 'longline',
    label: 'Longline',
  },
  {
    key: 'waterline',
    label: 'Waterline',
  },
  {
    key: 'midline',
    label: 'Midline',
  },
  {
    key: 'rodeoline',
    label: 'Rodeoline',
  },
  {
    key: 'trickline',
    label: 'Trickline',
  },
  {
    key: 'parkline',
    label: 'Parkline',
  },
];

export const useMapOptions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDisplayFeature, setSelectedDisplayFeature] =
    useState<SelectedDisplayFeature>('all');
  const [selectedType, setSelectedType] = useState<SlacklineType | SpotType | 'none'>('none');

  const typeFilter =
    selectedDisplayFeature === 'line' || selectedDisplayFeature === 'rigged'
      ? { label: 'Slackline Type', items: lineTypeFilterItems }
      : selectedDisplayFeature === 'spot'
        ? {
            label: 'Spot Type',
            items: spotTypeOptions.map((o) => ({ key: o.value, label: o.label })),
          }
        : undefined;

  const savedMapStyle = useAppLocalStorage('mapSettings.mapStyle', 'default');

  const Item = (props: { text: string; children: ReactNode }) => {
    return (
      <Stack direction={'row'} spacing={4} sx={{ alignItems: 'center' }}>
        <Typography variant={'body2'}>{props.text} </Typography>
        <Stack direction={'row'} spacing={2} sx={{ alignItems: 'center' }}>
          {props.children}
        </Stack>
      </Stack>
    );
  };

  const IconOption = (props: {
    icon: ReactNode;
    label: string;
    checked?: boolean;
    onClick: () => void;
  }) => {
    return (
      <Stack spacing={1} sx={{ alignItems: 'center', p: 1,
          borderRadius: '0.5rem',
          border: (theme) =>
            props.checked ? `2px solid ${theme.palette.primary.main}` : undefined,
          color: (theme) => (props.checked ? theme.palette.primary.main : undefined),
          '& svg': {
            color: (theme) => (props.checked ? theme.palette.primary.main : undefined),
          },
          '&:hover': {
            color: (theme) => theme.palette.primary.main,
            '& svg': {
              color: (theme) => theme.palette.primary.main,
            },
          } }}>
        <IconButton
          size="small"
          onClick={props.onClick}
          sx={{
            p: 0,
          }}
        >
          {props.icon}
        </IconButton>
        <Typography variant="body2" sx={{}}>
          {props.label}
        </Typography>
      </Stack>
    );
  };

  const MapOptionsComponent = (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 3,
        bottom: '2rem',
        left: '2rem',
      }}
    >
      <Dialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        sx={{
          '& .MuiDialog-paper': {
            p: 2,
          },
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant={'body2Bold'}>Features</Typography>
            <Divider />
            <Item text={'Display'}>
              {features.map((feature) => (
                <IconOption
                  key={feature.key}
                  icon={feature.icon}
                  label={feature.label}
                  checked={selectedDisplayFeature === feature.key}
                  onClick={() => {
                    setSelectedDisplayFeature(feature.key);
                    setSelectedType('none');
                  }}
                />
              ))}
            </Item>
            <Divider />
            <Item text={'Filter'}>
              <FormControl size="small" sx={{ m: 1, minWidth: '15ch' }} disabled={!typeFilter}>
                <InputLabel id="feature-type">{typeFilter?.label ?? 'Type'}</InputLabel>
                <Select
                  labelId="feature-type"
                  value={selectedType}
                  autoWidth
                  label={typeFilter?.label ?? 'Type'}
                  onChange={(event) => {
                    setSelectedType(event.target.value as SlacklineType | SpotType | 'none');
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  {typeFilter?.items.map((item) => (
                    <MenuItem key={item.key} value={item.key}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Item>
          </Stack>
          <Stack spacing={1}>
            <Typography variant={'body2Bold'}>
              Map{' '}
              <Typography variant={'caption'} component={'span'}>
                (Settings are saved in your browser)
              </Typography>
            </Typography>

            <Divider />
            <Item text={'Style'}>
              <IconOption
                icon={<CheckBoxIcon />}
                label={'Default'}
                checked={savedMapStyle.value === 'default'}
                onClick={() => {
                  savedMapStyle.set('default');
                }}
              />
              <IconOption
                icon={<SatelliteAltIcon />}
                label={'Satellite'}
                checked={savedMapStyle.value === 'satellite'}
                onClick={() => {
                  savedMapStyle.set('satellite');
                }}
              />
              <IconOption
                icon={<ForestIcon />}
                label={'Outdoors'}
                checked={savedMapStyle.value === 'outdoors'}
                onClick={() => {
                  savedMapStyle.set('outdoors');
                }}
              />
              <IconOption
                icon={<SignpostIcon />}
                label={'Streets'}
                checked={savedMapStyle.value === 'streets'}
                onClick={() => {
                  savedMapStyle.set('streets');
                }}
              />
            </Item>
          </Stack>
        </Stack>
      </Dialog>

      <IconButton
        onClick={() => {
          setIsDialogOpen(true);
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontSize: '2.2rem',
          borderRadius: '50%',
          width: '100',
          height: '100%',
          backgroundColor: (theme) => theme.palette.primary.main,
          '&:hover': {
            backgroundColor: (theme) => theme.palette.primary.main,
            borderStyle: 'solid',
            borderWidth: '2px',
            borderColor: (theme) => theme.palette.primary.contrastText,
          },
        }}
      >
        <LayersRoundedIcon
          fontSize={'inherit'}
          sx={{
            color: (theme) => theme.palette.primary.contrastText,
          }}
        />
      </IconButton>
    </Box>
  );

  return {
    MapOptionsComponent,
    selectedDisplayFeature,
    selectedLineType:
      (selectedDisplayFeature === 'line' || selectedDisplayFeature === 'rigged') && selectedType !== 'none'
        ? (selectedType as SlacklineType)
        : undefined,
    selectedSpotType:
      selectedDisplayFeature === 'spot' && selectedType !== 'none'
        ? (selectedType as SpotType)
        : undefined,
    selectedMapStyle: savedMapStyle.value,
  };
};
