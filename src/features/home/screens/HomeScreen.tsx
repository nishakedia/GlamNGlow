import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, SearchBar, SectionHeader, StateView, VendorCard, VendorCardSkeleton } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { qk } from '@/services/queryClient';
import { useFiltersStore } from '@/store/filtersStore';
import { colors, gutter, spacing } from '@/theme';
import type { CustomerTabScreenProps } from '@/types/navigation';
import type { Category, VendorCard as VendorCardRow } from '@/types/models';
import { useTopVendors } from '../api';
import { BroadcastCta } from '../components/BroadcastCta';
import { CategoryGrid } from '../components/CategoryGrid';
import { HomeHeader } from '../components/HomeHeader';
import { ModeToggle } from '../components/ModeToggle';

export function HomeScreen({ navigation }: CustomerTabScreenProps<'Home'>) {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const mode = useFiltersStore((s) => s.mode);
  const setMode = useFiltersStore((s) => s.setMode);

  const vendors = useTopVendors({ mode, limit: 10 });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.categories }),
      queryClient.invalidateQueries({ queryKey: qk.vendors.all }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const openCategory = useCallback(
    (category: Category) => navigation.navigate('SearchResults', { categorySlug: category.slug, title: category.name }),
    [navigation],
  );

  const openVendor = useCallback(
    (vendorId: string) => navigation.navigate('VendorProfile', { vendorId }),
    [navigation],
  );

  const header = (
    <View style={styles.header}>
      <HomeHeader onPressProfile={() => navigation.navigate('Profile')} />
      <SearchBar onPressFake={() => navigation.navigate('Explore')} />

      <View>
        <SectionHeader title="Browse by service" />
        <CategoryGrid onSelect={openCategory} />
      </View>

      <BroadcastCta onPress={() => requireAuth(() => navigation.navigate('BroadcastRequest', {}))} />

      <View style={styles.vendorsHeader}>
        <SectionHeader
          title="Top-rated artists"
          subtitle="Verified professionals loved by brides"
          actionLabel="See all"
          onAction={() => navigation.navigate('SearchResults', { title: 'All artists' })}
        />
        <ModeToggle value={mode} onChange={setMode} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList<VendorCardRow>
        data={vendors.data ?? []}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <VendorCard vendor={item} onPress={openVendor} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          vendors.isPending ? (
            <View style={styles.list}>
              <VendorCardSkeleton />
              <VendorCardSkeleton />
            </View>
          ) : vendors.isError ? (
            <ErrorState error={vendors.error} onRetry={vendors.refetch} compact />
          ) : (
            <StateView
              icon="search-outline"
              title="No artists yet"
              message={
                mode ? 'Try switching between at-home and at-salon.' : 'Check back soon — new artists join every week.'
              }
              compact
            />
          )
        }
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  vendorsHeader: { gap: spacing.xs },
  list: { gap: spacing.lg },
  separator: { height: spacing.lg },
});
