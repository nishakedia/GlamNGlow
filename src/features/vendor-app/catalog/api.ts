import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { assertOk, supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import type { InsertTables } from '@/types/models';

export function useMyServices() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.services,
    enabled: !!vendorId,
    queryFn: async () =>
      unwrap(
        await supabase.from('services').select('*, service_addons(*)').eq('vendor_id', vendorId!).order('sort_order'),
      ),
  });
}

type ServiceInput = Omit<InsertTables<'services'>, 'vendor_id'> & {
  addons?: { id?: string; name: string; price: number; duration_min?: number }[];
};

export function useUpsertService() {
  const queryClient = useQueryClient();
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async ({ addons, ...service }: ServiceInput) => {
      if (!vendorId) throw new Error('No artist profile');
      const saved = unwrap(
        await supabase
          .from('services')
          .upsert({ ...service, vendor_id: vendorId })
          .select()
          .single(),
      );
      if (addons) {
        assertOk(await supabase.from('service_addons').delete().eq('service_id', saved.id));
        if (addons.length) {
          assertOk(
            await supabase
              .from('service_addons')
              .insert(
                addons.map((a) => ({
                  service_id: saved.id,
                  name: a.name,
                  price: a.price,
                  duration_min: a.duration_min ?? 0,
                })),
              ),
          );
        }
      }
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.services });
      queryClient.invalidateQueries({ queryKey: qk.vendors.all });
    },
  });
}

/** Services are deactivated rather than deleted so past bookings keep their references. */
export function useSetServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ serviceId, active }: { serviceId: string; active: boolean }) =>
      assertOk(await supabase.from('services').update({ is_active: active }).eq('id', serviceId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.services }),
  });
}
