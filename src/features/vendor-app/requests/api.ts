import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate';
import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

/**
 * Everything waiting on this vendor:
 *  - broadcast offers (first to accept wins, shows a countdown to broadcast_expires_at)
 *  - direct booking requests (only this vendor can accept)
 */
export function useIncomingRequests() {
  const vendorId = useAuthStore((s) => s.vendorId);

  useRealtimeInvalidate({
    channel: `offers:${vendorId}`,
    table: 'booking_offers',
    filter: `vendor_id=eq.${vendorId}`,
    invalidate: [qk.vendorApp.requests],
    enabled: !!vendorId,
  });
  useRealtimeInvalidate({
    channel: `direct:${vendorId}`,
    table: 'bookings',
    filter: `vendor_id=eq.${vendorId}`,
    invalidate: [qk.vendorApp.requests, qk.vendorApp.today],
    enabled: !!vendorId,
  });

  return useQuery({
    queryKey: qk.vendorApp.requests,
    enabled: !!vendorId,
    queryFn: async () => {
      const [offers, direct] = await Promise.all([
        supabase
          .from('booking_offers')
          .select('*, bookings(*)')
          .eq('vendor_id', vendorId!)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*, booking_items(name, unit_price)')
          .eq('vendor_id', vendorId!)
          .eq('status', 'requested')
          .order('scheduled_at'),
      ]);
      return { offers: unwrap(offers), direct: unwrap(direct) };
    },
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    /** Resolves to `true` if you won the job (or declined), `false` if another artist was faster. */
    mutationFn: async ({ offerId, accept }: { offerId: string; accept: boolean }) =>
      unwrap(await supabase.rpc('respond_to_offer', { p_offer_id: offerId, p_accept: accept })),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.requests });
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.today });
    },
  });
}

export function useRespondToBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, accept }: { bookingId: string; accept: boolean }) =>
      unwrap(await supabase.rpc('respond_to_booking', { p_booking_id: bookingId, p_accept: accept })),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.requests });
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.today });
    },
  });
}
