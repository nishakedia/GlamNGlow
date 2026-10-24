import { ComingSoon } from '@/components';
import type { VendorTabScreenProps } from '@/types/navigation';

export function CalendarScreen(_props: VendorTabScreenProps<'Calendar'>) {
  return (
    <ComingSoon
      title="Availability"
      bullets={[
        'Month view with booking dots',
        'Weekly working hours editor',
        'Block time off (leave, personal)',
        'Customers only see slots inside your hours and outside bookings/time off',
      ]}
      hooks={['useAvailability()', 'useSaveWeeklyHours()', 'useAddTimeOff()', 'useMonthBookings(month)']}
    />
  );
}
