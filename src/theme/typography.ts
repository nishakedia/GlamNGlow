import type { TextStyle } from 'react-native';

/**
 * Font family names must match the keys passed to `useFonts` in src/App.tsx.
 * Fraunces (serif) is for headings only; Inter is for every piece of UI/body text.
 */
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
