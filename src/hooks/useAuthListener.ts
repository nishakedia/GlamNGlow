import { useEffect } from 'react';

import { queryClient } from '@/services/queryClient';
import { registerForPushNotifications } from '@/services/notifications';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

async function loadProfile(userId: string) {
  const [{ data: profile }, { data: vendor }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('vendors').select('id').eq('owner_id', userId).maybeSingle(),
  ]);
  useAuthStore.getState().setProfile(profile, vendor?.id ?? null);
}

/**
 * Mount once at the app root. Mirrors the Supabase session into the auth store,
 * loads the profile + vendor id (which drive role switching), registers for push,
 * and clears cached server data on sign-out.
 */
export function useAuthListener() {
  useEffect(() => {
    const { setSession, setInitialized, reset } = useAuthStore.getState();

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setInitialized();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        // Defer: Supabase recommends not awaiting other supabase calls inside this callback.
        setTimeout(() => {
          loadProfile(session.user.id);
          registerForPushNotifications(session.user.id);
        }, 0);
      }
      if (event === 'SIGNED_OUT') {
        reset();
        queryClient.clear();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);
}

/** Call after onboarding creates a vendor row so the navigator picks it up. */
export function refreshAuthProfile() {
  const userId = useAuthStore.getState().session?.user.id;
  return userId ? loadProfile(userId) : Promise.resolve();
}
