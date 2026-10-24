import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, SearchBar, StateView, Text, VendorCard, VendorCardSkeleton } from '@/components';
import { useDebounce } from '@/hooks/useDebounce';
import { useFiltersStore } from '@/store/filtersStore';
import { colors, gutter, spacing } from '@/theme';
import type { VendorSearchResult } from '@/types/models';
import type { CustomerTabScreenProps, RootStackScreenProps } from '@/types/navigation';
import { useSearchVendors } from '../api';
import { FilterBar } from '../components/FilterBar';

type Props = { categorySlug?: string; initialQuery?: string; showTitle?: string };

/** Shared by the Explore tab and the pushed SearchResults route. */
function SearchResults({ categorySlug, initialQuery = '', showTitle }: Props) {
  const navigation = useNavigation();
  const [text, setText] = useState(initialQuery);
  const query = useDebounce(text);
  const { mode, price, sort, verifiedOnly, location } = useFiltersStore();

  const filters = useMemo(
    () => ({ categorySlug, query, mode, price, sort, verifiedOnly, location }),
    [categorySlug, query, mode, price, sort, verifiedOnly, location],
  );
  const search = useSearchVendors(filters);
  const vendors = useMemo(() => search.data?.pages.flat() ?? [], [search.data]);

  const openVendor = useCallback(
    (vendorId: string) => navigation.navigate('VendorProfile', { vendorId }),
    [navigation],
  );

  return (
    <FlatList<VendorSearchResult>
      data={vendors}
      keyExtractor={(v) => v.id}
      renderItem={({ item }) => <VendorCard vendor={item} onPress={openVendor} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => search.hasNextPage && !search.isFetchingNextPage && search.fetchNextPage()}
      ListHeaderComponent={
        <View style={styles.header}>
          {showTitle ? <Text variant="h1">{showTitle}</Text> : null}
          <SearchBar value={text} onChangeText={setText} autoFocus={!categorySlug && !showTitle} />
          <FilterBar />
        </View>
      }
      ListEmptyComponent={
        search.isPending ? (
          <View style={styles.skeletons}>
            <VendorCardSkeleton />
            <VendorCardSkeleton />
          </View>
        ) : search.isError ? (
          <ErrorState error={search.error} onRetry={search.refetch} />
        ) : (
          <StateView icon="search-outline" title="No matches" message="Try a different search or loosen the filters." />
        )
      }
      ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
    />
  );
}

export function ExploreScreen(_: CustomerTabScreenProps<'Explore'>) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SearchResults showTitle="Explore" />
    </SafeAreaView>
  );
}

export function SearchResultsScreen({ route }: RootStackScreenProps<'SearchResults'>) {
  return (
    <View style={styles.root}>
      <SearchResults categorySlug={route.params.categorySlug} initialQuery={route.params.query} />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, paddingVertical: spacing.md },
  skeletons: { gap: spacing.lg },
  separator: { height: spacing.lg },
});
