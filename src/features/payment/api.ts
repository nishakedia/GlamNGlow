import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { supabase } from '@/services/supabase';
import { openRazorpayCheckout } from './razorpay';

type CreateOrderResponse = {
  order_id: string;
  amount: number; // paise
  currency: 'INR';
  key_id: string;
  booking_code: string;
};

async function invoke<T>(fn: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, { body });
  if (error) {
    // Edge Function errors carry the JSON body in `context`; surface its message when present.
    const ctx = (error as { context?: Response }).context;
    const detail = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error ?? error.message);
  }
  return data as T;
}

/**
 * Full online payment: create order (Edge Function) → Razorpay Checkout (UPI/cards/netbanking)
 * → verify signature (Edge Function). Resolves when the booking is marked paid.
 */
export function usePayForBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      prefill,
    }: {
      bookingId: string;
      prefill?: { contact?: string; name?: string };
    }) => {
      const order = await invoke<CreateOrderResponse>('razorpay-create-order', { booking_id: bookingId });
      const result = await openRazorpayCheckout({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Glam & Glow',
        description: `Booking #${order.booking_code}`,
        prefill,
        theme: { color: '#7B3A34' },
      });
      await invoke('razorpay-verify-payment', { booking_id: bookingId, ...result });
      return result;
    },
    onSuccess: (_d, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: qk.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: qk.bookings.all });
    },
  });
}
