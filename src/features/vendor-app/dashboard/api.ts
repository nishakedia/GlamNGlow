import { useQuery } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export function useEarningsSummary() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.summary,
    enabled: !!vendorId,
    queryFn: async () => {
      const row = unwrap(await supabase.rpc('vendor_earnings_summary'))[0];
      return row ?? { today_bookings: 0, today_earnings: 0, week_earnings: 0, month_earnings: 0, pending_payout: 0 };
    },
  });
}

/** Today's confirmed jobs, in time order. */
export function useTodayBookings() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.today,
    enabled: !!vendorId,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return unwrap(
        await supabase
          .from('bookings')
          .select('*, booking_items(name)')
          .eq('vendor_id', vendorId!)
          .in('status', ['accepted', 'en_route', 'in_progress', 'completed'])
          .gte('scheduled_at', start.toISOString())
          .lt('scheduled_at', end.toISOString())
          .order('scheduled_at'),
      );
    },
  });
}
