import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function RequestDetailScreen(_props: RootStackScreenProps<'RequestDetail'>) {
  return (
    <ComingSoon
      title="Job details"
      bullets={[
        'Customer name, address (home) and notes',
        'Start trip → advance to en_route and share location every 10 s',
        'Start service → in_progress, Complete → completed',
        'Chat with customer',
      ]}
      hooks={['useBooking(bookingId)', 'useAdvanceBooking()', 'usePublishLocation()']}
    />
  );
}
