/**
 * Pokédex Offline palette: an editorial encyclopedia look with Pokédex red as
 * the accent, neutral surfaces and high-contrast ink.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#191B20',
    textSecondary: '#5E6470',
    background: '#F6F7F8',
    backgroundElement: '#EEF0F2',
    backgroundSelected: '#E2E5E9',
    surface: '#FFFFFF',
    surfaceMuted: '#F2F4F6',
    border: '#D9DEE4',
    borderStrong: '#B8C0CA',
    accent: '#B3261E',
    accentDark: '#861C16',
    accentSoft: '#FBE9E7',
    onAccent: '#FFFFFF',
    success: '#2E7D32',
    successSoft: '#E6F4EA',
    warning: '#A15C00',
    warningSoft: '#FFF3DE',
    danger: '#B3261E',
    dangerSoft: '#FDECEA',
    info: '#1565C0',
    infoSoft: '#E7F1FB',
    inkMuted: '#8A8F99',
    shadow: '#191B20',
    skeleton: '#E6E9ED',
  },
  dark: {
    text: '#F5F1EA',
    textSecondary: '#B7B2A8',
    background: '#151518',
    backgroundElement: '#232329',
    backgroundSelected: '#2F2F36',
    surface: '#1E1E23',
    surfaceMuted: '#26262C',
    border: '#3A3A42',
    borderStrong: '#4C4C56',
    accent: '#EF5350',
    accentDark: '#B71C1C',
    accentSoft: '#3A1D1D',
    onAccent: '#FFFFFF',
    success: '#81C784',
    successSoft: '#1E3322',
    warning: '#FFB74D',
    warningSoft: '#3A2A14',
    danger: '#FF8A80',
    dangerSoft: '#3B1C1B',
    info: '#90CAF9',
    infoSoft: '#172B3D',
    inkMuted: '#8D929C',
    shadow: '#000000',
    skeleton: '#2E2E35',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 54, android: 78 }) ?? 0;
export const MaxContentWidth = 960;
export const MaxReadingWidth = 720;
