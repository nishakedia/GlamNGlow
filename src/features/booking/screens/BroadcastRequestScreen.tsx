import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function BroadcastRequestScreen(_props: RootStackScreenProps<'BroadcastRequest'>) {
  return (
    <ComingSoon
      title="Request nearby artists"
      bullets={[
        'Pick category, mode, date/time and approximate duration',
        "Budget input (what you'll pay the artist who accepts)",
        'Address (home) or current location (salon) — used to find vendors within radius',
        "Send → useCreateBooking with matchType 'broadcast' → BroadcastWaiting",
      ]}
      hooks={['useCreateBooking()', 'useAddresses()', 'useCategories()']}
    />
  );
}
