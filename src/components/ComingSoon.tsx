import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { Card } from './Card';
import { Screen } from './Screen';
import { Text } from './Text';

type ComingSoonProps = {
  title: string;
  /** What this screen will do — mirrors the checklist in docs/ROADMAP.md. */
  bullets: string[];
  /** The api.ts hooks already written for this screen. */
  hooks?: string[];
  children?: React.ReactNode;
};

/**
 * Placeholder for screens that are wired into navigation but not built yet.
 * Replace the whole component when you implement the screen (see docs/ADDING_A_FEATURE.md).
 */
export function ComingSoon({ title, bullets, hooks, children }: ComingSoonProps) {
  return (
    <Screen scroll edges={[]}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="construct-outline" size={22} color={colors.secondary} />
        </View>
        <Text variant="h1">{title}</Text>
        <Text color="textMuted">This screen is wired up and ready to be built.</Text>
      </View>
      <Card style={styles.card}>
        <Text variant="label">Planned</Text>
        {bullets.map((b) => (
          <View key={b} style={styles.bullet}>
            <Text color="primary">•</Text>
            <Text style={styles.flex}>{b}</Text>
          </View>
        ))}
      </Card>
      {hooks?.length ? (
        <Card style={styles.card}>
          <Text variant="label">Data hooks ready in api.ts</Text>
          {hooks.map((h) => (
            <Text key={h} variant="caption" color="secondary">
              {h}
            </Text>
          ))}
        </Card>
      ) : null}
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingVertical: spacing.xl },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { gap: spacing.sm, marginBottom: spacing.lg },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
