import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { formatRating } from '@/utils/format';
import { Text } from './Text';

export function Rating({ avg, count }: { avg: number; count: number }) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={count ? `Rated ${Number(avg).toFixed(1)} from ${count} reviews` : 'New artist'}
    >
      <Ionicons name="star" size={13} color={colors.star} />
      <Text variant="label">{formatRating(avg, count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
