import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function TrackingScreen(_props: RootStackScreenProps<'Tracking'>) {
  return (
    <ComingSoon
      title="Track booking"
      bullets={[
        'Status timeline from booking_events (requested → accepted → en route → in progress → completed)',
        "Live map of the artist's position while en route (vendor_locations via Realtime)",
        'Call / Chat buttons, salon directions for salon bookings',
        "Cancel (while allowed) and 'Rate & review' once completed",
      ]}
      hooks={[
        'useBooking(bookingId)',
        'useBookingEvents(bookingId)',
        'useVendorLocation(bookingId, enabled)',
        'useCancelBooking()',
      ]}
    />
  );
}
