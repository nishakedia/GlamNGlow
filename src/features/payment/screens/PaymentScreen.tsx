import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function PaymentScreen(_props: RootStackScreenProps<'Payment'>) {
  return (
    <ComingSoon
      title="Payment"
      bullets={[
        'Amount + booking summary',
        'Pay button → usePayForBooking (Edge Function order → Razorpay Checkout → signature verify)',
        'Razorpay sheet offers UPI apps, cards, netbanking, wallets',
        'Success → BookingConfirmation; failure → retry or switch to pay at service',
      ]}
      hooks={['usePayForBooking()', 'useBooking(bookingId)']}
    />
  );
}
