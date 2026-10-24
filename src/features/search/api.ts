import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import type { PriceRange, SortOption, UserLocation } from '@/store/filtersStore';
import type { ServiceMode, VendorSearchResult } from '@/types/models';

const PAGE_SIZE = 20;

export type SearchFilters = {
  categorySlug?: string;
  query?: string;
  mode: ServiceMode | null;
  price: PriceRange;
  sort: SortOption;
  verifiedOnly: boolean;
  location: UserLocation | null;
};

export async function searchVendors(filters: SearchFilters, offset: number): Promise<VendorSearchResult[]> {
  return unwrap(
    await supabase.rpc('search_vendors', {
      p_category_slug: filters.categorySlug || undefined,
      p_query: filters.query?.trim() || undefined,
      p_mode: filters.mode ?? undefined,
      p_min_price: filters.price.min ?? undefined,
      p_max_price: filters.price.max ?? undefined,
      p_lat: filters.location?.lat,
      p_lng: filters.location?.lng,
      p_verified_only: filters.verifiedOnly,
      // Distance sort needs a location; fall back to rating otherwise.
      p_sort: filters.sort === 'distance' && !filters.location ? 'rating' : filters.sort,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    }),
  );
}

export const searchVendorsQueryOptions = (filters: SearchFilters) =>
  infiniteQueryOptions({
    queryKey: qk.vendors.search(filters),
    queryFn: ({ pageParam }) => searchVendors(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE),
  });

export function useSearchVendors(filters: SearchFilters) {
  return useInfiniteQuery({
    ...searchVendorsQueryOptions(filters),
    placeholderData: (previous) => previous,
  });
}
