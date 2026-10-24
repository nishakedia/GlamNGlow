import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const bg: Record<Variant, [string, string]> = {
  primary: [colors.primary, colors.primaryPressed],
  secondary: [colors.secondary, colors.secondaryPressed],
  outline: ['transparent', colors.primarySoft],
  ghost: ['transparent', colors.surfaceMuted],
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  icon,
  style,
}: ButtonProps) {
  const filled = variant === 'primary' || variant === 'secondary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant][pressed ? 1 : 0] },
        variant === 'outline' && styles.outline,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? colors.textOnPrimary : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant="button" color={filled ? 'textOnPrimary' : 'primary'}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { borderWidth: 1.5, borderColor: colors.primary },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
