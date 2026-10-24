import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { FormField } from '@/components/FormField';
import { spacing } from '@/theme';
import type { RootStackScreenProps } from '@/types/navigation';
import { otpSchema, useSendOtp, useVerifyOtp, type OtpForm } from '../api';

const RESEND_SECONDS = 30;

export function VerifyOtpScreen({ route }: RootStackScreenProps<'VerifyOtp'>) {
  const { channel, target } = route.params;
  const verify = useVerifyOtp();
  const resend = useSendOtp();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const { control, handleSubmit, formState } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const onSubmit = handleSubmit(async ({ token }) => {
    try {
      await verify.mutateAsync({ channel, target, token });
      // No navigation needed: useAuthListener stores the new session, RootNavigator drops the
      // auth screens (they're only registered for guests) and the user lands where they were.
    } catch {
      // Shown inline via verify.error.
    }
  });

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <Text variant="h1">Enter the code</Text>
        <Text color="textMuted">Sent to {target}</Text>
        <Controller
          control={control}
          name="token"
          render={({ field }) => (
            <FormField
              label="6-digit code"
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                if (v.length === 6) onSubmit();
              }}
              error={formState.errors.token?.message ?? verify.error?.message}
            />
          )}
        />
        <Pressable
          disabled={secondsLeft > 0 || resend.isPending}
          onPress={() => resend.mutate({ channel, value: target }, { onSuccess: () => setSecondsLeft(RESEND_SECONDS) })}
          accessibilityRole="button"
        >
          <Text variant="label" color={secondsLeft > 0 ? 'textSubtle' : 'secondary'}>
            {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>
      <Button title="Verify" onPress={onSubmit} loading={verify.isPending} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.xl },
  button: { marginBottom: spacing.lg },
});
