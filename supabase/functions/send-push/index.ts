// Sends push notifications via the free Expo Push API (which delivers through FCM/APNs).
// Triggered by Supabase Database Webhooks (Dashboard → Database → Webhooks), see docs/DEPLOYMENT.md:
//   booking_offers  INSERT  → vendor: "New request nearby"
//   bookings        INSERT  → vendor: "New booking request" (direct bookings)
//   bookings        UPDATE  → customer/vendor: status changes
//   messages        INSERT  → the other party: new chat message
import { adminClient, json } from '../_shared/utils.ts';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  // deno-lint-ignore no-explicit-any
  record: Record<string, any>;
  // deno-lint-ignore no-explicit-any
  old_record: Record<string, any> | null;
};

type Push = { userIds: string[]; title: string; body: string; data: Record<string, unknown> };

const STATUS_COPY: Record<string, string> = {
  accepted: 'Your booking is confirmed 🎉',
  declined: 'The artist could not take this booking. Try another artist.',
  expired: 'No artist accepted in time. Try again or pick an artist directly.',
  en_route: 'Your artist is on the way',
  in_progress: 'Your appointment has started',
  completed: 'All done! Tap to rate your experience',
  cancelled: 'Your booking was cancelled',
};

const db = adminClient();

async function vendorOwner(vendorId: string | null): Promise<string[]> {
  if (!vendorId) return [];
  const { data } = await db.from('vendors').select('owner_id').eq('id', vendorId).single();
  return data?.owner_id ? [data.owner_id] : [];
}

async function buildPush(p: WebhookPayload): Promise<Push | null> {
  const r = p.record;
  if (p.table === 'booking_offers' && p.type === 'INSERT') {
    return {
      userIds: await vendorOwner(r.vendor_id),
      title: 'New request nearby',
      body: `A customer ${r.distance_km ?? ''} km away needs an artist. First to accept gets it!`,
      data: { screen: 'Requests', offerId: r.id },
    };
  }
  if (p.table === 'bookings' && p.type === 'INSERT' && r.match_type === 'direct') {
    return {
      userIds: await vendorOwner(r.vendor_id),
      title: 'New booking request',
      body: `Booking #${r.code}. Tap to accept or decline.`,
      data: { screen: 'Requests', bookingId: r.id },
    };
  }
  if (p.table === 'bookings' && p.type === 'UPDATE' && r.status !== p.old_record?.status) {
    const copy = STATUS_COPY[r.status];
    if (!copy) return null;
    const userIds = r.status === 'cancelled' ? [r.customer_id, ...(await vendorOwner(r.vendor_id))] : [r.customer_id];
    return { userIds, title: 'Glam & Glow', body: copy, data: { screen: 'Tracking', bookingId: r.id } };
  }
  if (p.table === 'messages' && p.type === 'INSERT') {
    const { data: b } = await db.from('bookings').select('customer_id, vendor_id').eq('id', r.booking_id).single();
    if (!b) return null;
    const parties = [b.customer_id, ...(await vendorOwner(b.vendor_id))];
    return {
      userIds: parties.filter((id) => id !== r.sender_id),
      title: 'New message',
      body: r.body ?? '📷 Photo',
      data: { screen: 'Chat', bookingId: r.booking_id },
    };
  }
  return null;
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as WebhookPayload;
  const push = await buildPush(payload);
  if (!push || push.userIds.length === 0) return json({ skipped: true });

  const { data: tokens } = await db.from('push_tokens').select('token').in('user_id', push.userIds);
  if (!tokens?.length) return json({ skipped: 'no tokens' });

  const messages = tokens.map(({ token }) => ({
    to: token,
    title: push.title,
    body: push.body,
    data: push.data,
    sound: 'default',
    channelId: 'default',
  }));

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
    if (!res.ok) console.error('Expo push failed', await res.text());
  }
  return json({ sent: messages.length });
});
