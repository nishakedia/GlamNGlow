import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function ServiceDetailScreen(_props: RootStackScreenProps<'ServiceDetail'>) {
  return (
    <ComingSoon
      title="Service details"
      bullets={[
        "Hero image, description, duration and what's included (packages)",
        "Home vs salon price toggle (hides a mode the artist doesn't offer)",
        'Add-on checklist bound to useBookingDraftStore.toggleAddon',
        'Continue → startDirect() then BookingDetails (wrapped in useRequireAuth)',
      ]}
      hooks={['useService(serviceId)']}
    />
  );
}
