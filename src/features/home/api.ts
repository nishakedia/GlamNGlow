/**
 * Home data layer — the reference pattern every feature's api.ts follows:
 *
 *   1. A plain async `fetchX` function that talks to Supabase and throws on error.
 *   2. A `xQueryOptions(...)` factory (key + fn + cache policy) so the same query can be
 *      used by a hook, prefetched, or invalidated from anywhere.
 *   3. A thin `useX` hook that screens call.
 *
 * Screens never import `supabase` directly.
 */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import type { Category, ServiceMode, VendorCard } from '@/types/models';

// ---------------------------------------------------------------- Categories
export async function fetchCategories(): Promise<Category[]> {
  return unwrap(
    await supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  );
}

export const categoriesQueryOptions = queryOptions({
  queryKey: qk.categories,
  queryFn: fetchCategories,
  staleTime: 60 * 60_000, // categories change rarely; refetch at most hourly
});

export function useCategories() {
  return useQuery(categoriesQueryOptions);
}

// ---------------------------------------------------------------- Top vendors
export type TopVendorsFilters = {
  mode: ServiceMode | null;
  limit?: number;
};

export async function fetchTopVendors({ mode, limit = 10 }: TopVendorsFilters): Promise<VendorCard[]> {
  let query = supabase.from('vendor_cards').select('*').eq('status', 'live');

  if (mode === 'home') query = query.eq('offers_home', true);
  if (mode === 'salon') query = query.eq('offers_salon', true);

  return unwrap(
    await query
      .order('is_verified', { ascending: false })
      .order('rating_avg', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(limit),
  );
}

export const topVendorsQueryOptions = (filters: TopVendorsFilters) =>
  queryOptions({
    queryKey: qk.vendors.top(filters),
    queryFn: () => fetchTopVendors(filters),
    staleTime: 5 * 60_000,
  });

export function useTopVendors(filters: TopVendorsFilters) {
  return useQuery({
    ...topVendorsQueryOptions(filters),
    // Keep showing the previous list while a new mode filter loads (no flash of skeletons).
    placeholderData: (previous) => previous,
  });
}
