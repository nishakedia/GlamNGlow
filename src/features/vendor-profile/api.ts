import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { assertOk, supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export function useVendor(vendorId: string) {
  return useQuery({
    queryKey: qk.vendors.detail(vendorId),
    queryFn: async () => unwrap(await supabase.from('vendor_cards').select('*').eq('id', vendorId).single()),
  });
}

/** Full vendor row (bio, salon address, languages) — the card view omits these. */
export function useVendorDetails(vendorId: string) {
  return useQuery({
    queryKey: [...qk.vendors.detail(vendorId), 'full'],
    queryFn: async () => unwrap(await supabase.from('vendors').select('*').eq('id', vendorId).single()),
  });
}

export function useVendorServices(vendorId: string) {
  return useQuery({
    queryKey: qk.vendors.services(vendorId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('services')
          .select('*, service_addons(*)')
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .order('is_package', { ascending: false })
          .order('sort_order'),
      ),
  });
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: qk.service(serviceId),
    queryFn: async () =>
      unwrap(await supabase.from('services').select('*, service_addons(*)').eq('id', serviceId).single()),
  });
}

export function useVendorPortfolio(vendorId: string) {
  return useQuery({
    queryKey: qk.vendors.portfolio(vendorId),
    queryFn: async () =>
      unwrap(await supabase.from('portfolio_items').select('*').eq('vendor_id', vendorId).order('sort_order')),
  });
}

export function useVendorReviews(vendorId: string, limit = 20) {
  return useQuery({
    queryKey: qk.vendors.reviews(vendorId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('reviews')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false })
          .limit(limit),
      ),
  });
}

/** Bookable start times for a vendor on a date (yyyy-mm-dd), computed server-side. */
export function useAvailableSlots(vendorId: string | null, date: string | null, durationMin: number | null) {
  return useQuery({
    queryKey: qk.vendors.slots(vendorId ?? '', date ?? '', durationMin ?? 0),
    enabled: !!vendorId && !!date && !!durationMin,
    staleTime: 30_000,
    queryFn: async () =>
      unwrap(
        await supabase.rpc('get_available_slots', {
          p_vendor_id: vendorId!,
          p_date: date!,
          p_duration_min: durationMin!,
        }),
      ).map((r) => r.slot_start),
  });
}

export function useFavorites() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: qk.favorites,
    enabled: !!userId,
    queryFn: async () => new Set(unwrap(await supabase.from('favorites').select('vendor_id')).map((f) => f.vendor_id)),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ vendorId, favorite }: { vendorId: string; favorite: boolean }) => {
      if (!userId) throw new Error('Sign in to save artists');
      if (favorite) assertOk(await supabase.from('favorites').insert({ user_id: userId, vendor_id: vendorId }));
      else assertOk(await supabase.from('favorites').delete().eq('user_id', userId).eq('vendor_id', vendorId));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.favorites }),
  });
}
