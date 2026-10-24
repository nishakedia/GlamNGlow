import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function VendorKycScreen(_props: RootStackScreenProps<'VendorKyc'>) {
  return (
    <ComingSoon
      title="Verify your identity"
      bullets={[
        'Choose ID type (Aadhaar, PAN, Passport, Driving licence)',
        'Photo of ID via expo-image-picker (camera or gallery)',
        'Live selfie via camera',
        "Upload to private 'kyc' bucket → useSubmitKyc → VendorSetup",
        'Face match: manual admin comparison by default; plug a provider into vendor_kyc.match_score later',
      ]}
      hooks={['useSubmitKyc()']}
    />
  );
}
