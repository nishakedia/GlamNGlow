import { useQuery } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export function usePayouts() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.payouts,
    enabled: !!vendorId,
    queryFn: async () =>
      unwrap(
        await supabase.from('payouts').select('*').eq('vendor_id', vendorId!).order('period_end', { ascending: false }),
      ),
  });
}

/** Completed jobs with the vendor's share (service + add-ons + travel; platform fee excluded). */
export function useCompletedJobs(limit = 50) {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: [...qk.vendorApp.payouts, 'jobs', limit],
    enabled: !!vendorId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('bookings')
          .select('id, code, scheduled_at, subtotal, addons_total, travel_fee, payment_method')
          .eq('vendor_id', vendorId!)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(limit),
      ).map((b) => ({ ...b, vendor_share: b.subtotal + b.addons_total + b.travel_fee })),
  });
}
