import { useEffect, useState } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import { Box, Chip, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip } from '@mui/material';

import { SlacklineType, SpotType } from '@server/core/types';
import { getSlacklineMapStats } from 'app/api/geojson-data';
import { useSessionReady } from 'app/session';
import { appColors } from 'styles/theme/colors';
import { glass, panelSurface } from 'styles/theme/panelTheme';
import { useAppLocalStorage } from 'utils/hooks/useAppLocalStorage';
import { spotTypeOptions } from 'utils/spotTypes';

export type SelectedDisplayFeature = SlacklineMapFeatureType | 'all' | 'active';
export type SelectedMapStyle = 'default' | 'satellite' | 'outdoors' | 'streets';

const lineTypeFilterItems: { key: SlacklineType; label: string }[] = [
  { key: 'highline', label: 'Highline' },
  { key: 'longline', label: 'Longline' },
  { key: 'waterline', label: 'Waterline' },
  { key: 'midline', label: 'Midline' },
  { key: 'rodeoline', label: 'Rodeoline' },
  { key: 'trickline', label: 'Trickline' },
  { key: 'parkline', label: 'Parkline' },
];

const mapStyleItems: { key: SelectedMapStyle; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'satellite', label: 'Satellite' },
  { key: 'outdoors', label: 'Outdoors' },
  { key: 'streets', label: 'Streets' },
];

type Stats = Awaited<ReturnType<typeof getSlacklineMapStats>>;

// The chips float on the map, so their hover and focus colors must stay opaque.
const chipSx = (selected: boolean, extra: object = {}) => ({
  bgcolor: selected ? '#fff' : glass.background,
  color: selected ? panelSurface : glass.text,
  backdropFilter: glass.blur,
  border: 'none',
  fontWeight: selected ? 600 : 500,
  flexShrink: 0,
  '&&:hover, &&.Mui-focusVisible': { bgcolor: selected ? '#e9edf1' : glass.hover },
  '& .MuiChip-deleteIcon': { color: selected ? panelSurface : glass.muted },
  ...extra,
});

// The chips are the legend and the filter at once: their colors are the map's colors.
export const useMapOptions = () => {
  const sessionReady = useSessionReady();
  const [selectedDisplayFeature, setSelectedDisplayFeature] =
    useState<SelectedDisplayFeature>('all');
  const [selectedType, setSelectedType] = useState<SlacklineType | SpotType | 'none'>('none');
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<HTMLElement | null>(null);
  const [styleMenuAnchor, setStyleMenuAnchor] = useState<HTMLElement | null>(null);
  const [stats, setStats] = useState<Stats>();
  const savedMapStyle = useAppLocalStorage('mapSettings.mapStyle', 'default');

  useEffect(() => {
    if (sessionReady) getSlacklineMapStats().then(setStats);
  }, [sessionReady]);

  const typeFilter =
    selectedDisplayFeature === 'line' || selectedDisplayFeature === 'active'
      ? { label: 'Line type', items: lineTypeFilterItems }
      : selectedDisplayFeature === 'spot'
        ? { label: 'Spot type', items: spotTypeOptions.map((o) => ({ key: o.value, label: o.label })) }
        : undefined;

  const count = (n?: number) => (n === undefined ? '' : ` ${n.toLocaleString()}`);
  const displayChips: { key: SelectedDisplayFeature; label: string; color?: string; hidden?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'line', label: `Lines${count(stats?.lineCount)}`, color: appColors.lineStrokeColor },
    { key: 'spot', label: `Spots${count(stats?.spotCount)}`, color: appColors.spotFillColor },
    { key: 'guide', label: `Access guides${count(stats?.guideCount)}`, color: appColors.guideFeaturesColor },
    {
      key: 'active',
      label: `Active now${count(stats?.activeCount)}`,
      color: appColors.activeColor,
      hidden: !stats?.activeCount,
    },
  ];

  const selectedTypeLabel = typeFilter?.items.find((i) => i.key === selectedType)?.label;

  const FilterChips = (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        position: 'absolute',
        zIndex: 3,
        top: { xs: 64, lg: 60 },
        left: 10,
        right: { xs: 0, lg: 160 },
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
      }}
    >
      {displayChips
        .filter((c) => !c.hidden)
        .map((c) => {
          const selected = selectedDisplayFeature === c.key;
          return (
            <Chip
              key={c.key}
              label={c.label}
              size="small"
              icon={
                c.color ? (
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color }} />
                ) : undefined
              }
              onClick={() => {
                setSelectedDisplayFeature(c.key);
                setSelectedType('none');
              }}
              sx={chipSx(selected, { '& .MuiChip-icon': { ml: 1 } })}
            />
          );
        })}
      {typeFilter && (
        <Chip
          label={selectedTypeLabel ?? typeFilter.label}
          size="small"
          deleteIcon={<ArrowDropDownIcon />}
          onDelete={(e) => setTypeMenuAnchor(e.currentTarget.parentElement)}
          onClick={(e) => setTypeMenuAnchor(e.currentTarget)}
          sx={chipSx(Boolean(selectedTypeLabel))}
        />
      )}
      <Menu anchorEl={typeMenuAnchor} open={Boolean(typeMenuAnchor)} onClose={() => setTypeMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setSelectedType('none');
            setTypeMenuAnchor(null);
          }}
        >
          All types
        </MenuItem>
        {typeFilter?.items.map((item) => (
          <MenuItem
            key={item.key}
            selected={item.key === selectedType}
            onClick={() => {
              setSelectedType(item.key as SlacklineType | SpotType);
              setTypeMenuAnchor(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );

  const MapStyleButton = (
    <>
      <Tooltip title="Map style" placement="left">
        <IconButton
          onClick={(e) => setStyleMenuAnchor(e.currentTarget)}
          sx={{
            position: 'absolute',
            zIndex: 3,
            top: { xs: 104, lg: 64 },
            right: { xs: 10, lg: 16 },
            bgcolor: glass.background,
            backdropFilter: glass.blur,
            color: glass.text,
            borderRadius: '10px',
            '&:hover': { bgcolor: glass.hover },
          }}
        >
          <LayersRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={styleMenuAnchor} open={Boolean(styleMenuAnchor)} onClose={() => setStyleMenuAnchor(null)}>
        {mapStyleItems.map((item) => (
          <MenuItem
            key={item.key}
            onClick={() => {
              savedMapStyle.set(item.key);
              setStyleMenuAnchor(null);
            }}
          >
            <ListItemIcon>{savedMapStyle.value === item.key && <CheckIcon fontSize="small" />}</ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return {
    FilterChips,
    MapStyleButton,
    selectedDisplayFeature,
    selectedLineType:
      (selectedDisplayFeature === 'line' || selectedDisplayFeature === 'active') && selectedType !== 'none'
        ? (selectedType as SlacklineType)
        : undefined,
    selectedSpotType:
      selectedDisplayFeature === 'spot' && selectedType !== 'none'
        ? (selectedType as SpotType)
        : undefined,
    selectedMapStyle: savedMapStyle.value as SelectedMapStyle,
  };
};
