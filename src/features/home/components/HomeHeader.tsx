import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useAuthStore } from '@/store/authStore';
import { useFiltersStore } from '@/store/filtersStore';
import { colors, radius, spacing } from '@/theme';
import { greeting } from '@/utils/format';

type Props = { onPressProfile: () => void };

export function HomeHeader({ onPressProfile }: Props) {
  const name = useAuthStore((s) => s.profile?.full_name?.split(' ')[0]);
  const location = useFiltersStore((s) => s.location);
  const { detect, loading } = useCurrentLocation();

  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Pressable
          onPress={detect}
          style={styles.location}
          accessibilityRole="button"
          accessibilityLabel={location ? `Location: ${location.label}. Tap to update` : 'Set your location'}
        >
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text variant="label" numberOfLines={1} style={styles.locationText}>
            {location?.label ?? 'Set your location'}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          )}
        </Pressable>
        <Text variant="display" accessibilityRole="header">
          {greeting()}
          {name ? `, ${name}` : ''}
        </Text>
        <Text color="textMuted">Book artists who come to you, or visit their studio.</Text>
      </View>
      <Pressable onPress={onPressProfile} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Profile">
        <Ionicons name="person-outline" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  location: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', maxWidth: '90%' },
  locationText: { flexShrink: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
