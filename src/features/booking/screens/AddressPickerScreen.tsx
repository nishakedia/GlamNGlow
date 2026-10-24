import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function AddressPickerScreen(_props: RootStackScreenProps<'AddressPicker'>) {
  return (
    <ComingSoon
      title="Add address"
      bullets={[
        'Search box using services/places.ts (free OSM by default, Google optional)',
        "'Use current location' via useCurrentLocation",
        'react-native-maps pin to fine-tune (Map.web fallback for web)',
        'Label (Home/Work/Other), flat/landmark fields with RHF + Zod → useSaveAddress',
      ]}
      hooks={['useSaveAddress()', 'searchPlaces() / resolvePlace()']}
    />
  );
}
