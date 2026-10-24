import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function BroadcastWaitingScreen(_props: RootStackScreenProps<'BroadcastWaiting'>) {
  return (
    <ComingSoon
      title="Finding your artist\u2026"
      bullets={[
        'Countdown to broadcast_expires_at',
        "Realtime: status flips to 'accepted' the instant the first vendor accepts → Tracking",
        "On 'expired': suggest another time or browsing artists directly",
        'Cancel request → useCancelBooking',
      ]}
      hooks={['useBooking(bookingId) (realtime)', 'useCancelBooking()']}
    />
  );
}
