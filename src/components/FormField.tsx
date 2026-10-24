import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing, webInputReset } from '@/theme';
import { Text } from './Text';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  prefix?: string;
};

/** Labelled text input with inline error. Pair with react-hook-form's <Controller>. */
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, prefix, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View style={[styles.inputRow, !!error && styles.inputError]}>
        {prefix ? <Text color="textMuted">{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, style]}
          accessibilityLabel={label}
          {...inputProps}
        />
      </View>
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.md,
    ...webInputReset,
  },
});
