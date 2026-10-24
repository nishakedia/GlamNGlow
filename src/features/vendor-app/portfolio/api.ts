import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/services/queryClient';
import { publicUrl, uploadImage } from '@/services/storage';
import { assertOk, supabase, unwrap } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export function useMyPortfolio() {
  const vendorId = useAuthStore((s) => s.vendorId);
  return useQuery({
    queryKey: qk.vendorApp.portfolio,
    enabled: !!vendorId,
    queryFn: async () =>
      unwrap(await supabase.from('portfolio_items').select('*').eq('vendor_id', vendorId!).order('sort_order')),
  });
}

/** Upload a picked image (expo-image-picker URI) to the public `portfolio` bucket. */
export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async ({ uri, caption, categoryId }: { uri: string; caption?: string; categoryId?: string }) => {
      if (!userId || !vendorId) throw new Error('No artist profile');
      const path = await uploadImage('portfolio', `${userId}/${Date.now()}.jpg`, uri);
      assertOk(
        await supabase.from('portfolio_items').insert({
          vendor_id: vendorId,
          image_url: publicUrl('portfolio', path),
          caption: caption ?? null,
          category_id: categoryId ?? null,
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.portfolio }),
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => assertOk(await supabase.from('portfolio_items').delete().eq('id', id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.portfolio }),
  });
}
