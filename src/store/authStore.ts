import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Profile } from '@/types/models';

export type ActiveRole = 'customer' | 'vendor';

type AuthState = {
  /** Supabase session (null = guest). Kept in sync by useAuthListener. */
  session: Session | null;
  profile: Profile | null;
  /** The vendor row id owned by this user, if they have started vendor onboarding. */
  vendorId: string | null;
  /** Which app shell the user is looking at. Drives the root navigator. */
  activeRole: ActiveRole;
  /** True once the persisted session has been read on launch. */
  initialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null, vendorId: string | null) => void;
  setActiveRole: (role: ActiveRole) => void;
  setInitialized: () => void;
  reset: () => void;
};

/**
 * Client-side auth state. Server data about the user (bookings, etc.) belongs in
 * React Query, not here — this store only holds what the navigator needs to decide
 * which screens to show.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      vendorId: null,
      activeRole: 'customer',
      initialized: false,

      setSession: (session) => set({ session }),
      setProfile: (profile, vendorId) =>
        set((s) => ({
          profile,
          vendorId,
          // Never leave someone in the vendor shell without a vendor account.
          activeRole: vendorId ? s.activeRole : 'customer',
        })),
      setActiveRole: (activeRole) => set({ activeRole }),
      setInitialized: () => set({ initialized: true }),
      reset: () => set({ session: null, profile: null, vendorId: null, activeRole: 'customer' }),
    }),
    {
      name: 'gg-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // The Supabase client persists the session itself; only remember the UI preference.
      partialize: (s) => ({ activeRole: s.activeRole }),
    },
  ),
);

export const selectIsSignedIn = (s: AuthState) => s.session !== null;
export const selectUserId = (s: AuthState) => s.session?.user.id ?? null;
