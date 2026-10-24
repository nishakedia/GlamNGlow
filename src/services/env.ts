import { z } from 'zod';

/**
 * Validates public env vars once at startup so a missing key fails loudly
 * instead of producing confusing network errors later.
 * EXPO_PUBLIC_* values must be referenced statically (process.env.EXPO_PUBLIC_X)
 * for Expo to inline them into the bundle.
 */
const schema = z.object({
  supabaseUrl: z.string().url('EXPO_PUBLIC_SUPABASE_URL is missing or invalid'),
  supabaseAnonKey: z.string().min(20, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing'),
  razorpayKeyId: z.string().optional(),
  placesProvider: z.enum(['osm', 'google']).default('osm'),
  googlePlacesKey: z.string().optional(),
});

const parsed = schema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || undefined,
  placesProvider: process.env.EXPO_PUBLIC_PLACES_PROVIDER || undefined,
  googlePlacesKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY || undefined,
});

export const envError: string | null = parsed.success ? null : parsed.error.issues.map((i) => i.message).join('\n');

export const env = parsed.success
  ? parsed.data
  : // Placeholder values keep imports from crashing; App.tsx renders a setup screen when envError is set.
    {
      supabaseUrl: 'https://placeholder.supabase.co',
      supabaseAnonKey: 'placeholder-anon-key-placeholder',
      razorpayKeyId: undefined,
      placesProvider: 'osm' as const,
      googlePlacesKey: undefined,
    };
