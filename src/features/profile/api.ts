import { useMutation } from '@tanstack/react-query';

import { refreshAuthProfile } from '@/hooks/useAuthListener';
import { assertOk, supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

/** The profile itself lives in the auth store (loaded by useAuthListener); this only updates it. */
export function useUpdateProfile() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (patch: { full_name?: string; email?: string; avatar_url?: string }) => {
      if (!userId) throw new Error('Please sign in');
      assertOk(await supabase.from('profiles').update(patch).eq('id', userId));
    },
    onSuccess: () => refreshAuthProfile(),
  });
}
