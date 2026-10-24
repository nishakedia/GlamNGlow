// Verifies the signature Razorpay Checkout returns to the app, then marks the booking paid.
// The webhook (razorpay-webhook) is the backstop if the app closes before calling this.
import { adminClient, corsHeaders, getUser, hmacSha256Hex, json, requireEnv, safeEqual } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Not signed in' }, 401);

    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment fields' }, 400);
    }

    const expected = await hmacSha256Hex(
      requireEnv('RAZORPAY_KEY_SECRET'),
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );
    if (!safeEqual(expected, razorpay_signature)) return json({ error: 'Invalid payment signature' }, 400);

    const db = adminClient();
    const { data: payment } = await db
      .from('payments')
      .select('id, booking_id, bookings!inner(customer_id)')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('booking_id', booking_id)
      .single();

    // deno-lint-ignore no-explicit-any
    if (!payment || (payment as any).bookings.customer_id !== user.id) {
      return json({ error: 'Payment not found' }, 404);
    }

    await db.from('payments').update({ status: 'paid', razorpay_payment_id }).eq('id', payment.id);
    await db.from('bookings').update({ payment_status: 'paid' }).eq('id', booking_id);

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
