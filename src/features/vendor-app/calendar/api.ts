import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { assertOk, supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export type WeeklyHours = { weekday: number; start_time: string; end_time: string }[];

export function useAvailability() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.availability,
    enabled: !!vendorId,
    queryFn: async () => {
      const [hours, timeOff] = await Promise.all([
        supabase.from('vendor_availability').select('*').eq('vendor_id', vendorId!).order('weekday'),
        supabase
          .from('vendor_time_off')
          .select('*')
          .eq('vendor_id', vendorId!)
          .gte('ends_at', new Date().toISOString())
          .order('starts_at'),
      ]);
      return { hours: unwrap(hours), timeOff: unwrap(timeOff) };
    },
  });
}

/** Replaces the whole weekly schedule (simplest correct approach for a small table). */
export function useSaveWeeklyHours() {
  const queryClient = useQueryClient();
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async (hours: WeeklyHours) => {
      if (!vendorId) throw new Error('No artist profile');
      assertOk(await supabase.from('vendor_availability').delete().eq('vendor_id', vendorId));
      if (hours.length) {
        assertOk(await supabase.from('vendor_availability').insert(hours.map((h) => ({ ...h, vendor_id: vendorId }))));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.availability }),
  });
}

export function useAddTimeOff() {
  const queryClient = useQueryClient();
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async (input: { starts_at: string; ends_at: string; reason?: string }) => {
      if (!vendorId) throw new Error('No artist profile');
      assertOk(await supabase.from('vendor_time_off').insert({ ...input, vendor_id: vendorId }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.availability }),
  });
}

/** Bookings for a month (yyyy-mm) to paint calendar dots. */
export function useMonthBookings(month: string) {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.calendar(month),
    enabled: !!vendorId,
    queryFn: async () => {
      const start = new Date(`${month}-01T00:00:00`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return unwrap(
        await supabase
          .from('bookings')
          .select('id, scheduled_at, duration_min, status, mode')
          .eq('vendor_id', vendorId!)
          .in('status', ['requested', 'accepted', 'en_route', 'in_progress', 'completed'])
          .gte('scheduled_at', start.toISOString())
          .lt('scheduled_at', end.toISOString()),
      );
    },
  });
}
