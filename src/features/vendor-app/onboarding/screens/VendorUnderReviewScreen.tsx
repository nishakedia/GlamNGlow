import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function VendorUnderReviewScreen(_props: RootStackScreenProps<'VendorUnderReview'>) {
  return (
    <ComingSoon
      title="Under review"
      bullets={[
        'Shows the current vendor status (kyc_pending / under_review / rejected with notes)',
        'Admins approve with admin_review_vendor() — see docs/BACKEND.md',
        "Once 'live', the artist can switch to artist mode from Profile",
      ]}
      hooks={['useMyVendor()']}
    />
  );
}
