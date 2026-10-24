import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/** White rounded surface with a soft shadow — the base of every card layout. */
export function Card({ children, onPress, padded = true, style, accessibilityLabel }: CardProps) {
  const cardStyle = [styles.card, padded && styles.padded, style];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
