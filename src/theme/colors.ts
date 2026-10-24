/**
 * Brand palette. Components must reference semantic tokens (`colors.primary`,
 * `colors.text`) rather than raw hex values so the palette can evolve in one place.
 */
const palette = {
  cherryCola: '#7B3A34',
  cherryCola700: '#5E2C27',
  cherryCola100: '#F1E4E2',
  powerBlue: '#2C477A',
  powerBlue700: '#1F3358',
  powerBlue100: '#E3E8F2',
  ivory: '#FAF6F2',
  ivoryDeep: '#F2EBE4',
  charcoal: '#241D1B',
  white: '#FFFFFF',
  gray600: '#6B625F',
  gray400: '#A39A96',
  gray200: '#E6DFDA',
  success: '#2F7A4F',
  successBg: '#E3F1E8',
  warning: '#B7791F',
  danger: '#B3261E',
  star: '#D4A017',
} as const;

export const colors = {
  primary: palette.cherryCola,
  primaryPressed: palette.cherryCola700,
  primarySoft: palette.cherryCola100,
  secondary: palette.powerBlue,
  secondaryPressed: palette.powerBlue700,
  secondarySoft: palette.powerBlue100,

  background: palette.ivory,
  surface: palette.white,
  surfaceMuted: palette.ivoryDeep,
  border: palette.gray200,

  text: palette.charcoal,
  textMuted: palette.gray600,
  textSubtle: palette.gray400,
  textOnPrimary: palette.white,

  verified: palette.powerBlue,
  success: palette.success,
  successBg: palette.successBg,
  warning: palette.warning,
  danger: palette.danger,
  star: palette.star,
  overlay: 'rgba(36, 29, 27, 0.45)',
} as const;

export type ColorToken = keyof typeof colors;
