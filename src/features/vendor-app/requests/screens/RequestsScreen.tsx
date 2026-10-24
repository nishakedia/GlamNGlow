import { ComingSoon } from '@/components';
import type { VendorTabScreenProps } from '@/types/navigation';

export function RequestsScreen(_props: VendorTabScreenProps<'Requests'>) {
  return (
    <ComingSoon
      title="Requests"
      bullets={[
        'Broadcast offers with distance and a countdown — first to accept wins',
        'Direct booking requests (only you can accept)',
        "Accept / Decline buttons; 'Too late' toast when another artist was faster",
        'Live via Realtime, plus push notification from send-push',
      ]}
      hooks={['useIncomingRequests()', 'useRespondToOffer()', 'useRespondToBooking()']}
    />
  );
}
