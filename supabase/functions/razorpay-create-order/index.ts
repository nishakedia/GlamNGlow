// Creates a Razorpay order for a booking. The app opens Razorpay Checkout with the returned order_id.
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (SUPABASE_* are injected automatically).
import { adminClient, corsHeaders, getUser, json, requireEnv } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Not signed in' }, 401);

    const { booking_id } = await req.json();
    if (!booking_id) return json({ error: 'booking_id is required' }, 400);

    const db = adminClient();
    const { data: booking, error } = await db
      .from('bookings')
      .select('id, code, customer_id, total, status, payment_method, payment_status')
      .eq('id', booking_id)
      .single();

    if (error || !booking) return json({ error: 'Booking not found' }, 404);
    if (booking.customer_id !== user.id) return json({ error: 'Not your booking' }, 403);
    if (booking.payment_method !== 'online') return json({ error: 'This booking is pay-at-service' }, 400);
    if (booking.payment_status === 'paid') return json({ error: 'Already paid' }, 409);
    if (!['requested', 'accepted'].includes(booking.status)) {
      return json({ error: `Cannot pay for a booking that is ${booking.status}` }, 409);
    }

    const keyId = requireEnv('RAZORPAY_KEY_ID');
    const keySecret = requireEnv('RAZORPAY_KEY_SECRET');
    const amountPaise = booking.total * 100;

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: booking.code,
        notes: { booking_id: booking.id },
      }),
    });
    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay order failed', order);
      return json({ error: order?.error?.description ?? 'Could not start payment' }, 502);
    }

    const { error: insertError } = await db.from('payments').insert({
      booking_id: booking.id,
      razorpay_order_id: order.id,
      amount: booking.total,
      status: 'pending',
      raw: order,
    });
    if (insertError) throw insertError;

    await db.from('bookings').update({ payment_status: 'pending' }).eq('id', booking.id);

    return json({
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
      booking_code: booking.code,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
