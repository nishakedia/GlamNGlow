import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
};

/** Every piece of text goes through here so fonts and colours stay on-brand. */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  return (
    <RNText style={[typography[variant], { color: colors[color] }, align && { textAlign: align }, style]} {...rest} />
  );
}
