import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { refreshAuthProfile } from '@/hooks/useAuthListener';
import { qk } from '@/services/queryClient';
import { uploadImage } from '@/services/storage';
import { assertOk, supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

/** The signed-in user's own vendor row (any status), or null. */
export function useMyVendor() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: qk.vendorApp.me,
    enabled: !!userId,
    queryFn: async () =>
      unwrapMaybe(await supabase.from('vendors').select('*, vendor_kyc(*)').eq('owner_id', userId!).maybeSingle()),
  });
}

/** Step 1: create the draft vendor profile. */
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: {
      business_name: string;
      city: string;
      area?: string;
      offers_home: boolean;
      offers_salon: boolean;
      categoryIds: string[];
    }) => {
      if (!userId) throw new Error('Please sign in');
      const { categoryIds, ...vendor } = input;
      const row = unwrap(
        await supabase
          .from('vendors')
          .insert({ ...vendor, owner_id: userId, status: 'draft' })
          .select()
          .single(),
      );
      assertOk(
        await supabase
          .from('vendor_categories')
          .insert(categoryIds.map((category_id) => ({ vendor_id: row.id, category_id }))),
      );
      return row;
    },
    onSuccess: async () => {
      await refreshAuthProfile();
      queryClient.invalidateQueries({ queryKey: qk.vendorApp.me });
    },
  });
}

/** Step 2: upload ID document + selfie to the private `kyc` bucket and submit for review. */
export function useSubmitKyc() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async (input: { idDocType: string; idDocUri: string; selfieUri: string }) => {
      if (!userId || !vendorId) throw new Error('Create your artist profile first');
      const stamp = Date.now();
      const idPath = await uploadImage('kyc', `${userId}/id-${stamp}.jpg`, input.idDocUri);
      const selfiePath = await uploadImage('kyc', `${userId}/selfie-${stamp}.jpg`, input.selfieUri);
      assertOk(
        await supabase.from('vendor_kyc').upsert({
          vendor_id: vendorId,
          id_doc_type: input.idDocType,
          id_doc_path: idPath,
          selfie_path: selfiePath,
          status: 'pending',
        }),
      );
      assertOk(await supabase.from('vendors').update({ status: 'kyc_pending' }).eq('id', vendorId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.me }),
  });
}

/** Step 4: after portfolio + pricing are set up, hand over to admin review. */
export function useSubmitForReview() {
  const queryClient = useQueryClient();
  const vendorId = useAuthStore((s) => s.vendorId);
  return useMutation({
    mutationFn: async () => {
      if (!vendorId) throw new Error('No artist profile');
      assertOk(await supabase.from('vendors').update({ status: 'under_review' }).eq('id', vendorId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.vendorApp.me }),
  });
}
