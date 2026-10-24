import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';
import { env } from './env';

/**
 * The single Supabase client. Only the anon key ships in the app; Row Level
 * Security (supabase/migrations) decides what each user can read or write.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Pause token refresh while the app is backgrounded (recommended by Supabase for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

type Result<T> = { data: T; error: { message: string } | null };

/** For queries that must return data (lists, `.single()`). Throws so React Query exposes `error`. */
export function unwrap<T>(result: Result<T>): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data == null) throw new Error('Not found');
  return result.data as NonNullable<T>;
}

/** For `.maybeSingle()` queries where "no row" is a valid answer. */
export function unwrapMaybe<T>(result: Result<T>): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? null;
}

/** For writes that don't `.select()` anything back. */
export function assertOk(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message);
}
