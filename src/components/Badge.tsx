import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type ColorToken } from '@/theme';
import { Text } from './Text';

type BadgeProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'verified' | 'neutral' | 'success' | 'primary';
};

const tones: Record<NonNullable<BadgeProps['tone']>, { bg: string; fg: ColorToken }> = {
  verified: { bg: colors.secondarySoft, fg: 'secondary' },
  neutral: { bg: colors.surfaceMuted, fg: 'textMuted' },
  success: { bg: colors.successBg, fg: 'success' },
  primary: { bg: colors.primarySoft, fg: 'primary' },
};

export function Badge({ label, icon, tone = 'neutral' }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={colors[t.fg]} /> : null}
      <Text variant="small" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

/** The trust signal shown wherever a vendor appears. Keep it prominent. */
export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <Ionicons name="checkmark-circle" size={16} color={colors.verified} accessibilityLabel="Verified artist" />;
  }
  return <Badge label="Verified" icon="shield-checkmark" tone="verified" />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
