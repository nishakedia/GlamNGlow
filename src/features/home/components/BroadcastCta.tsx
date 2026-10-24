import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

/** Entry point to broadcast matching: send one request to every nearby verified artist. */
export function BroadcastCta({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text variant="h3" color="textOnPrimary">
          Need someone today?
        </Text>
        <Text variant="caption" color="textOnPrimary" style={styles.copy}>
          Send one request to verified artists nearby. The first to accept gets the booking.
        </Text>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="flash" size={20} color={colors.secondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
  },
  pressed: { backgroundColor: colors.secondaryPressed },
  flex: { flex: 1, gap: spacing.xs },
  copy: { opacity: 0.85 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
