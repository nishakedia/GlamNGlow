import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function RateReviewScreen(_props: RootStackScreenProps<'RateReview'>) {
  return (
    <ComingSoon
      title="Rate & review"
      bullets={[
        '1–5 star selector',
        'Comment (RHF + Zod)',
        "Up to 5 photos via expo-image-picker → 'reviews' bucket",
        'Submit → useSubmitReview (RLS only allows reviews of your completed bookings)',
      ]}
      hooks={['useSubmitReview()']}
    />
  );
}
