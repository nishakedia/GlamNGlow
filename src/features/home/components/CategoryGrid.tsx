import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorState, Skeleton, Text } from '@/components';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Category } from '@/types/models';
import { useCategories } from '../api';

const COLUMNS = 3;

type Props = { onSelect: (category: Category) => void };

export function CategoryGrid({ onSelect }: Props) {
  const { data, isPending, isError, error, refetch } = useCategories();

  if (isPending) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={styles.cell}>
            <Skeleton height={96} borderRadius={radius.lg} />
          </View>
        ))}
      </View>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} compact />;

  return (
    <View style={styles.grid}>
      {data.map((category) => (
        <View key={category.id} style={styles.cell}>
          <CategoryTile category={category} onPress={() => onSelect(category)} />
        </View>
      ))}
    </View>
  );
}

function CategoryTile({ category, onPress }: { category: Category; onPress: () => void }) {
  // Icon names come from the database; fall back gracefully if one is mistyped.
  const icon = (
    category.icon in Ionicons.glyphMap ? category.icon : 'sparkles-outline'
  ) as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}. ${category.tagline ?? ''}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text variant="label" align="center" numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const GAP = spacing.md;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, rowGap: GAP },
  cell: { width: `${100 / COLUMNS}%`, paddingHorizontal: GAP / 2 },
  tile: {
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadow.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
