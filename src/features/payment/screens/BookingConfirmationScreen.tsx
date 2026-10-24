import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function BookingConfirmationScreen(_props: RootStackScreenProps<'BookingConfirmation'>) {
  return (
    <ComingSoon
      title="Booking confirmed"
      bullets={[
        'Success illustration + booking code',
        "'Waiting for artist to accept' state for direct requests",
        'Buttons: Track booking, Chat with artist, Back to home',
        'Clears useBookingDraftStore',
      ]}
      hooks={['useBooking(bookingId)']}
    />
  );
}
