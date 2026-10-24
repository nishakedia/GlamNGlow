import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { assertOk, supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

const ACTIVE = ['requested', 'broadcasting', 'accepted', 'en_route', 'in_progress'] as const;
const PAST = ['completed', 'cancelled', 'declined', 'expired'] as const;

export type BookingScope = 'upcoming' | 'past';

export function useMyBookings(scope: BookingScope) {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: qk.bookings.mine(scope),
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('bookings')
          .select('*, vendors(id, business_name, avatar_url), categories(name)')
          .eq('customer_id', userId!)
          .in('status', scope === 'upcoming' ? [...ACTIVE] : [...PAST])
          .order('scheduled_at', { ascending: scope === 'upcoming' })
          .limit(50),
      ),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: {
      bookingId: string;
      vendorId: string;
      rating: number;
      comment?: string;
      photoUrls?: string[];
    }) => {
      if (!userId) throw new Error('Please sign in');
      assertOk(
        await supabase.from('reviews').insert({
          booking_id: input.bookingId,
          vendor_id: input.vendorId,
          customer_id: userId,
          rating: input.rating,
          comment: input.comment ?? null,
          photo_urls: input.photoUrls ?? [],
        }),
      );
    },
    onSuccess: (_d, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: qk.vendors.reviews(vendorId) });
      queryClient.invalidateQueries({ queryKey: qk.bookings.all });
    },
  });
}
