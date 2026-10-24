import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function BookingDetailsScreen(_props: RootStackScreenProps<'BookingDetails'>) {
  return (
    <ComingSoon
      title="Booking details"
      bullets={[
        'At home / At salon toggle (draft.mode)',
        'Horizontal 14-day date strip',
        'Time slots from get_available_slots (server removes clashes and time off)',
        "Saved addresses list with 'Add new' → AddressPicker (home mode only)",
        'Notes for the artist, then Continue → OrderReview',
      ]}
      hooks={['useAvailableSlots(vendorId, date, duration)', 'useAddresses()']}
    />
  );
}
