import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components';
import { spacing } from '@/theme';
import type { ServiceMode } from '@/types/models';

const OPTIONS: {
  label: string;
  value: ServiceMode | null;
  icon: 'apps-outline' | 'home-outline' | 'storefront-outline';
}[] = [
  { label: 'Any', value: null, icon: 'apps-outline' },
  { label: 'At home', value: 'home', icon: 'home-outline' },
  { label: 'At salon', value: 'salon', icon: 'storefront-outline' },
];

type Props = { value: ServiceMode | null; onChange: (mode: ServiceMode | null) => void };

/** "Any / At home / At salon" filter. Bound to the shared filters store by the caller. */
export function ModeToggle({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => (
        <Chip
          key={o.label}
          label={o.label}
          icon={o.icon}
          selected={value === o.value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
});
