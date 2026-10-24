import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BookingDraft } from '@/store/bookingDraftStore';
import type { UserLocation } from '@/store/filtersStore';
import type { Address, InsertTables, ServiceMode } from '@/types/models';

// ---------------------------------------------------------------- Addresses
export function useAddresses() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: qk.addresses,
    enabled: !!userId,
    queryFn: async (): Promise<Address[]> =>
      unwrap(
        await supabase
          .from('addresses')
          .select('*')
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false }),
      ),
  });
}

export function useSaveAddress() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (address: Omit<InsertTables<'addresses'>, 'user_id'>) => {
      if (!userId) throw new Error('Please sign in');
      return unwrap(
        await supabase
          .from('addresses')
          .insert({ ...address, user_id: userId })
          .select()
          .single(),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.addresses }),
  });
}

// ---------------------------------------------------------------- Price quote
/** Server-computed price breakdown for Order Review (same function create_booking uses). */
export function useQuote(serviceId: string | null, mode: ServiceMode, addonIds: string[]) {
  return useQuery({
    queryKey: qk.quote({ serviceId, mode, addonIds: [...addonIds].sort() }),
    enabled: !!serviceId,
    queryFn: async () => {
      const rows = unwrap(
        await supabase.rpc('quote_booking', { p_service_id: serviceId!, p_mode: mode, p_addon_ids: addonIds }),
      );
      const quote = rows[0];
      if (!quote) throw new Error('Could not price this booking');
      return quote;
    },
  });
}

// ---------------------------------------------------------------- Create booking
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ draft, location }: { draft: BookingDraft; location: UserLocation | null }) => {
      if (!draft.categoryId || !draft.scheduledAt) throw new Error('Please pick a date and time');
      return unwrap(
        await supabase.rpc('create_booking', {
          p_match_type: draft.matchType,
          p_mode: draft.mode,
          p_category_id: draft.categoryId,
          p_scheduled_at: draft.scheduledAt,
          p_payment_method: draft.paymentMethod,
          p_vendor_id: draft.vendorId ?? undefined,
          p_service_id: draft.serviceId ?? undefined,
          p_addon_ids: draft.addonIds,
          p_budget: draft.budget ?? undefined,
          p_duration_min: draft.durationMin ?? undefined,
          p_address_id: draft.addressId ?? undefined,
          p_lat: location?.lat,
          p_lng: location?.lng,
          p_notes: draft.notes || undefined,
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings.all });
      queryClient.invalidateQueries({ queryKey: qk.vendors.all }); // slots changed
    },
  });
}
