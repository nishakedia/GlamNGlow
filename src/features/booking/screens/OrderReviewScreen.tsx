import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function OrderReviewScreen(_props: RootStackScreenProps<'OrderReview'>) {
  return (
    <ComingSoon
      title="Review your booking"
      bullets={[
        'Artist, service, add-ons, date/time and address summary',
        'Price breakdown from quote_booking (service, add-ons, travel fee, platform fee, total)',
        'Payment method: Pay online (UPI/cards) or Pay at service',
        'Confirm → useCreateBooking → Payment (online) or BookingConfirmation (pay at service)',
      ]}
      hooks={['useQuote(serviceId, mode, addonIds)', 'useCreateBooking()']}
    />
  );
}
