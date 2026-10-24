import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function VendorSetupScreen(_props: RootStackScreenProps<'VendorSetup'>) {
  return (
    <ComingSoon
      title="Portfolio & pricing"
      bullets={[
        'Add at least 3 portfolio photos',
        'Add at least 1 service with home and/or salon price',
        'Set service radius and salon address',
        'Submit for review → useSubmitForReview → VendorUnderReview',
      ]}
      hooks={['useAddPortfolioItem()', 'useUpsertService()', 'useSubmitForReview()']}
    />
  );
}
