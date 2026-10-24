// Razorpay → Supabase webhook. Configure in Razorpay Dashboard → Settings → Webhooks:
//   URL:    https://<project-ref>.supabase.co/functions/v1/razorpay-webhook
//   Events: payment.captured, payment.failed, refund.processed
// Secret: RAZORPAY_WEBHOOK_SECRET (the value you type into the Razorpay dashboard).
// JWT verification is disabled for this function in supabase/config.toml.
import { adminClient, hmacSha256Hex, json, requireEnv, safeEqual } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const expected = await hmacSha256Hex(requireEnv('RAZORPAY_WEBHOOK_SECRET'), raw);
  if (!safeEqual(expected, signature)) return json({ error: 'Bad signature' }, 401);

  const event = JSON.parse(raw);
  const db = adminClient();

  const statusByEvent: Record<string, 'paid' | 'failed' | 'refunded'> = {
    'payment.captured': 'paid',
    'payment.failed': 'failed',
    'refund.processed': 'refunded',
  };
  const status = statusByEvent[event.event];
  if (!status) return json({ ignored: event.event });

  // Payment events carry the order id; refund events only carry the payment id.
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  const query = db
    .from('payments')
    .update(
      refund
        ? { status, raw: event }
        : { status, razorpay_payment_id: payment?.id, method: payment?.method, raw: event },
    );
  const { data: row } = await (
    refund ? query.eq('razorpay_payment_id', refund.payment_id) : query.eq('razorpay_order_id', payment?.order_id)
  )
    .select('booking_id')
    .maybeSingle();

  if (row) await db.from('bookings').update({ payment_status: status }).eq('id', row.booking_id);
  return json({ ok: true });
});
