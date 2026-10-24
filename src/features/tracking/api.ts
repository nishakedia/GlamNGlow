import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate';
import { qk } from '@/services/queryClient';
import { assertOk, supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import type { BookingStatus } from '@/types/models';

/** Booking + vendor + items, live-updated via Realtime. Used by both customer and vendor screens. */
export function useBooking(bookingId: string) {
  useRealtimeInvalidate({
    channel: `booking:${bookingId}`,
    table: 'bookings',
    filter: `id=eq.${bookingId}`,
    invalidate: [qk.bookings.detail(bookingId), qk.bookings.events(bookingId)],
  });
  return useQuery({
    queryKey: qk.bookings.detail(bookingId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('bookings')
          .select('*, vendors(id, business_name, avatar_url, salon_address, lat, lng), booking_items(*)')
          .eq('id', bookingId)
          .single(),
      ),
  });
}

export function useBookingEvents(bookingId: string) {
  return useQuery({
    queryKey: qk.bookings.events(bookingId),
    queryFn: async () =>
      unwrap(await supabase.from('booking_events').select('*').eq('booking_id', bookingId).order('created_at')),
  });
}

/** Vendor's live position while en route to an at-home booking. */
export function useVendorLocation(bookingId: string, enabled: boolean) {
  useRealtimeInvalidate({
    channel: `location:${bookingId}`,
    table: 'vendor_locations',
    filter: `booking_id=eq.${bookingId}`,
    invalidate: [qk.bookings.location(bookingId)],
    enabled,
  });
  return useQuery({
    queryKey: qk.bookings.location(bookingId),
    enabled,
    queryFn: async () =>
      unwrapMaybe(await supabase.from('vendor_locations').select('*').eq('booking_id', bookingId).maybeSingle()),
  });
}

// ---------------------------------------------------------------- Chat
export function useMessages(bookingId: string) {
  useRealtimeInvalidate({
    channel: `messages:${bookingId}`,
    table: 'messages',
    filter: `booking_id=eq.${bookingId}`,
    invalidate: [qk.bookings.messages(bookingId)],
  });
  return useQuery({
    queryKey: qk.bookings.messages(bookingId),
    queryFn: async () =>
      unwrap(await supabase.from('messages').select('*').eq('booking_id', bookingId).order('created_at')),
  });
}

export function useSendMessage(bookingId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ body, imagePath }: { body?: string; imagePath?: string }) => {
      if (!userId) throw new Error('Please sign in');
      assertOk(
        await supabase
          .from('messages')
          .insert({ booking_id: bookingId, sender_id: userId, body: body ?? null, image_path: imagePath ?? null }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.bookings.messages(bookingId) }),
  });
}

// ---------------------------------------------------------------- Lifecycle actions
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      unwrap(await supabase.rpc('cancel_booking', { p_booking_id: bookingId, p_reason: reason })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.bookings.all }),
  });
}

/** Vendor: accepted → en_route → in_progress → completed. */
export function useAdvanceBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      unwrap(await supabase.rpc('advance_booking', { p_booking_id: bookingId, p_status: status })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings.all });
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.today });
    },
  });
}

/** Vendor: publish current coordinates (call every ~10 s from expo-location while en route). */
export function usePublishLocation() {
  return useMutation({
    mutationFn: async (loc: { bookingId: string; vendorId: string; lat: number; lng: number; heading?: number }) =>
      assertOk(
        await supabase.from('vendor_locations').upsert({
          booking_id: loc.bookingId,
          vendor_id: loc.vendorId,
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading ?? null,
          updated_at: new Date().toISOString(),
        }),
      ),
  });
}
