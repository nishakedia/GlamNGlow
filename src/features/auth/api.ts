import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { supabase } from '@/services/supabase';
import { normalizeIndianPhone } from '@/utils/format';

/**
 * Phone OTP is the primary sign-in. Email OTP is a free fallback: Supabase sends
 * email codes without any paid provider, while SMS needs Twilio/MSG91/etc. (and DLT
 * registration in India). See docs/DEPLOYMENT.md → "Auth".
 */
export type OtpChannel = 'phone' | 'email';

export const loginSchema = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('phone'),
    value: z
      .string()
      .refine((v) => /^(91)?[6-9]\d{9}$/.test(v.replace(/\D/g, '')), 'Enter a valid 10-digit Indian mobile number'),
  }),
  z.object({
    channel: z.literal('email'),
    value: z.string().trim().email('Enter a valid email address'),
  }),
]);
export type LoginForm = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  token: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type OtpForm = z.infer<typeof otpSchema>;

/** Sends a one-time code. Resolves to the normalised phone/email the code was sent to. */
export function useSendOtp() {
  return useMutation({
    mutationFn: async ({ channel, value }: LoginForm) => {
      if (channel === 'phone') {
        const phone = normalizeIndianPhone(value);
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw new Error(error.message);
        return phone;
      }
      const email = value.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw new Error(error.message);
      return email;
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async ({ channel, target, token }: { channel: OtpChannel; target: string; token: string }) => {
      const { data, error } =
        channel === 'phone'
          ? await supabase.auth.verifyOtp({ phone: target, token, type: 'sms' })
          : await supabase.auth.verifyOtp({ email: target, token, type: 'email' });
      if (error) throw new Error(error.message);
      return data.session;
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
  });
}
