import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components';
import { PRICE_PRESETS, useFiltersStore, type SortOption } from '@/store/filtersStore';
import { colors, spacing } from '@/theme';

const SORTS: { label: string; value: SortOption }[] = [
  { label: 'Top rated', value: 'rating' },
  { label: 'Nearest', value: 'distance' },
  { label: 'Price: low', value: 'price_low' },
  { label: 'Price: high', value: 'price_high' },
];

/** Home/salon, price and sort filters. Reads and writes the shared filters store. */
export function FilterBar() {
  const { mode, price, sort, verifiedOnly, location, setMode, setPrice, setSort, setVerifiedOnly } = useFiltersStore();

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          label="At home"
          icon="home-outline"
          selected={mode === 'home'}
          onPress={() => setMode(mode === 'home' ? null : 'home')}
        />
        <Chip
          label="At salon"
          icon="storefront-outline"
          selected={mode === 'salon'}
          onPress={() => setMode(mode === 'salon' ? null : 'salon')}
        />
        <Chip
          label="Verified"
          icon="shield-checkmark-outline"
          selected={verifiedOnly}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
        />
        <View style={styles.divider} />
        {PRICE_PRESETS.map((p) => {
          const selected = price.min === p.value.min && price.max === p.value.max;
          return (
            <Chip
              key={p.label}
              label={p.label}
              selected={selected}
              onPress={() => setPrice(selected ? { min: null, max: null } : p.value)}
            />
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SORTS.filter((s) => s.value !== 'distance' || location).map((s) => (
          <Chip key={s.value} label={s.label} selected={sort === s.value} onPress={() => setSort(s.value)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { gap: spacing.sm, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
});
