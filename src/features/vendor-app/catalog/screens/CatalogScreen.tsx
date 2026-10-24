import { ComingSoon } from '@/components';
import type { VendorTabScreenProps } from '@/types/navigation';

export function CatalogScreen(_props: VendorTabScreenProps<'Catalog'>) {
  return (
    <ComingSoon
      title="Services"
      bullets={[
        'List of services and packages with home/salon prices',
        'Add / edit form (RHF + Zod) with add-ons',
        'Activate / deactivate toggle',
        'Header button → Portfolio manager',
      ]}
      hooks={['useMyServices()', 'useUpsertService()', 'useSetServiceActive()']}
    />
  );
}
