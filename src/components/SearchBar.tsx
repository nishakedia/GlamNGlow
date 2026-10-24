import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fonts, radius, spacing, webInputReset } from '@/theme';
import { Text } from './Text';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  /** When set, renders a non-editable bar that navigates on tap (used on Home). */
  onPressFake?: () => void;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search makeup, mehndi, nails…',
  onPressFake,
  autoFocus,
}: SearchBarProps) {
  if (onPressFake) {
    return (
      <Pressable
        onPress={onPressFake}
        style={styles.bar}
        accessibilityRole="search"
        accessibilityLabel="Search artists and services"
      >
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <Text color="textSubtle" style={styles.flex}>
          {placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCorrect={false}
        style={[styles.input, styles.flex]}
        accessibilityLabel="Search artists and services"
      />
      {value ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flex: { flex: 1 },
  input: { fontFamily: fonts.sans, fontSize: 15, color: colors.text, paddingVertical: 0, ...webInputReset },
});
