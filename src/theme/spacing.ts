import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** 4-pt spacing scale. Prefer these over literal numbers. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#241D1B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;

/** Horizontal page gutter used by every screen. */
export const gutter = spacing.lg;

/** Removes the browser's default focus ring on web text inputs (the border already shows focus). */
export const webInputReset: TextStyle = Platform.OS === 'web' ? { outlineWidth: 0 } : {};
