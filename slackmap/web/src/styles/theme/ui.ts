import { brand } from './brand';

// The map's feature colors stay in colors.ts.
export const ui = {
  blue: '#2E73B8',
  blueDark: '#245C96',
  blueTint: '#EAF2FA',
  active: '#E0388A',
  onActive: '#FFFFFF',
  activeTint: '#FDEAF3',
  activeInk: '#9C1A5C',
  activeRing: 'rgba(224, 56, 138, 0.3)',
  warningTint: brand('isa-color-category-yellow-bg'),
  warningInk: brand('isa-color-category-yellow-fg'),
  danger: brand('isa-color-action-danger-bg'),
  dangerTint: '#FCEDEA',
  success: '#34A853',
  text: brand('isa-color-text-default'),
  muted: '#6B7785',
  line: '#E6EAEE',
  fill: '#F2F4F7',
  fillHover: '#E8EBEF',
  toast: '#111A24',
  onBlue: '#FFFFFF',
  onBlueMuted: 'rgba(255, 255, 255, 0.86)',
  onBlueFill: 'rgba(255, 255, 255, 0.15)',
  onBlueFillHover: 'rgba(255, 255, 255, 0.22)',
  backdrop: 'rgba(10, 20, 32, 0.45)',
};

export const radius = { field: 10, card: 16, pill: 999 };

export const shadow = {
  float: '0 1px 2px rgba(10, 25, 45, 0.08), 0 10px 28px rgba(10, 25, 45, 0.16)',
  chip: '0 1px 3px rgba(10, 25, 45, 0.2)',
};
