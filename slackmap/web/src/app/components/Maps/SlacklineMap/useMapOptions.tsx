import { useEffect, useRef, useState } from 'react';
import { useControl } from 'react-map-gl/mapbox';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, ListItemIcon, Menu, MenuItem, Stack } from '@mui/material';

import { SlacklineType, SpotType } from '@server/core/types';
import { getSlacklineMapStats } from 'app/api/geojson-data';
import { useSessionReady } from 'app/session';
import { appColors } from 'styles/theme/colors';
import { shadow, ui } from 'styles/theme/ui';
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
  height: 28,
  bgcolor: selected ? ui.blue : '#fff',
  color: selected ? '#fff' : ui.text,
  boxShadow: shadow.chip,
  border: 'none',
  flexShrink: 0,
  '&&:hover, &&.Mui-focusVisible': { bgcolor: selected ? ui.blueDark : ui.fill },
  '& .MuiChip-deleteIcon': { color: selected ? '#fff' : ui.muted },
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
        top: { xs: 60, lg: 58 },
        left: 'calc(var(--panel-inset, 0px) + 12px)',
        right: { xs: 0, lg: 'calc(var(--card-inset, 0px) + 160px)' },
        overflowX: 'auto',
        p: '2px 4px 6px 2px',
        m: '-2px',
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

  const MapStyleControl = <StyleControl onOpen={setStyleMenuAnchor} />;

  const MapStyleMenu = (
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
  );

  return {
    FilterChips,
    MapStyleControl,
    MapStyleMenu,
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

const layersIcon =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 5-9 5-9-5 9-5zM3 14l9 5 9-5"/></svg>';

// The map-style button as a map control, so it stacks with zoom and locate instead of floating apart.
const StyleControl = (props: { onOpen: (anchor: HTMLElement) => void }) => {
  const onOpen = useRef(props.onOpen);
  onOpen.current = props.onOpen;
  useControl(() => {
    const group = document.createElement('div');
    return {
      onAdd: () => {
        group.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        const button = document.createElement('button');
        button.type = 'button';
        button.title = 'Map style';
        button.setAttribute('aria-label', 'Map style');
        button.style.display = 'grid';
        button.style.placeItems = 'center';
        button.style.color = ui.text;
        button.innerHTML = layersIcon;
        button.onclick = () => onOpen.current(button);
        group.replaceChildren(button);
        return group;
      },
      onRemove: () => group.remove(),
    };
  }, { position: 'bottom-right' });
  return null;
};
