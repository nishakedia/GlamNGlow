import { ComingSoon } from '@/components';
import type { VendorTabScreenProps } from '@/types/navigation';

export function EarningsScreen(_props: VendorTabScreenProps<'Earnings'>) {
  return (
    <ComingSoon
      title="Earnings & payouts"
      bullets={[
        'Today / week / month totals and pending payout',
        'Completed jobs with your share',
        'Payout history (payouts table, filled by admin or a payout job)',
      ]}
      hooks={['useEarningsSummary()', 'useCompletedJobs()', 'usePayouts()']}
    />
  );
}
