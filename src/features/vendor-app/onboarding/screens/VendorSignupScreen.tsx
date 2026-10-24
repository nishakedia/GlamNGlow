import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function VendorSignupScreen(_props: RootStackScreenProps<'VendorSignup'>) {
  return (
    <ComingSoon
      title="Become an artist"
      bullets={[
        'Business name, city/area (RHF + Zod)',
        'Pick categories (makeup, mehndi, nails, bridal, salon…)',
        'Choose modes: at customer’s home, at your studio, or both',
        'Create → useCreateVendor (status draft) → VendorKyc',
        'Flow: signup → KYC → portfolio & pricing → admin review → go live',
      ]}
      hooks={['useCreateVendor()', 'useCategories()']}
    />
  );
}
