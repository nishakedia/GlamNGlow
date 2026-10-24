import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { FormField } from '@/components/FormField';
import { spacing } from '@/theme';
import type { RootStackScreenProps } from '@/types/navigation';
import { loginSchema, useSendOtp, type LoginForm } from '../api';

export function PhoneLoginScreen({ navigation }: RootStackScreenProps<'PhoneLogin'>) {
  const sendOtp = useSendOtp();
  const { control, handleSubmit, formState, reset } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { channel: 'phone', value: '' },
  });
  const channel = useWatch({ control, name: 'channel' });
  const isPhone = channel === 'phone';

  const onSubmit = handleSubmit(async (form) => {
    try {
      const target = await sendOtp.mutateAsync(form);
      navigation.navigate('VerifyOtp', { channel: form.channel, target });
    } catch {
      // Shown inline via sendOtp.error.
    }
  });

  const toggleChannel = () => {
    sendOtp.reset();
    reset({ channel: isPhone ? 'email' : 'phone', value: '' });
  };

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Text variant="display">Welcome to Glam & Glow</Text>
          <Text color="textMuted">
            {isPhone
              ? "Enter your mobile number. We'll send a one-time code to sign you in."
              : "Enter your email. We'll send a one-time code to sign you in."}
          </Text>

          <Controller
            control={control}
            name="value"
            render={({ field }) => (
              <FormField
                key={channel}
                label={isPhone ? 'Mobile number' : 'Email address'}
                prefix={isPhone ? '+91' : undefined}
                keyboardType={isPhone ? 'phone-pad' : 'email-address'}
                autoComplete={isPhone ? 'tel' : 'email'}
                textContentType={isPhone ? 'telephoneNumber' : 'emailAddress'}
                autoCapitalize="none"
                maxLength={isPhone ? 14 : 120}
                placeholder={isPhone ? '98765 43210' : 'you@example.com'}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={onSubmit}
                error={formState.errors.value?.message}
              />
            )}
          />
          {sendOtp.error ? (
            <Text variant="caption" color="danger">
              {sendOtp.error.message}
            </Text>
          ) : null}
          <Pressable onPress={toggleChannel} accessibilityRole="button" hitSlop={8}>
            <Text variant="label" color="secondary">
              {isPhone ? 'Use email instead' : 'Use mobile number instead'}
            </Text>
          </Pressable>
        </View>
        <Button title="Send code" onPress={onSubmit} loading={sendOtp.isPending} />
        <Text variant="caption" color="textMuted" align="center" style={styles.terms}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingBottom: spacing.lg },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.xl },
  terms: { marginTop: spacing.md },
});
