import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, gutter } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Leave false when the child is a FlatList. */
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  footer?: ReactNode;
};

/** Ivory, safe-area-aware page container used by every screen. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  style,
  refreshControl,
  footer,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, styles.scrollContent, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  padded: { paddingHorizontal: gutter },
  scrollContent: { paddingBottom: 32 },
  footer: {
    paddingHorizontal: gutter,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
