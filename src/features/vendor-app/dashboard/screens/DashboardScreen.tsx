import { useQueryClient } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, SectionHeader, Skeleton, StateView, Text } from '@/components';
import { qk } from '@/services/queryClient';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing } from '@/theme';
import type { VendorTabScreenProps } from '@/types/navigation';
import { formatINR, formatTime } from '@/utils/format';
import { useEarningsSummary, useTodayBookings } from '../api';

export function DashboardScreen({ navigation }: VendorTabScreenProps<'Dashboard'>) {
  const queryClient = useQueryClient();
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const summary = useEarningsSummary();
  const today = useTodayBookings();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: qk.vendorApp.summary });
    queryClient.invalidateQueries({ queryKey: qk.vendorApp.today });
  };

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text variant="display">Today</Text>
        <Text color="textMuted">Your bookings and earnings at a glance.</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Today's jobs" value={summary.data ? String(summary.data.today_bookings) : null} />
        <Stat label="Today" value={summary.data ? formatINR(summary.data.today_earnings) : null} />
        <Stat label="This month" value={summary.data ? formatINR(summary.data.month_earnings) : null} />
      </View>

      <SectionHeader title="Schedule" actionLabel="Requests" onAction={() => navigation.navigate('Requests')} />
      <View style={styles.list}>
        {today.isPending ? <Skeleton height={70} /> : null}
        {today.data?.length === 0 ? (
          <StateView
            icon="cafe-outline"
            title="No bookings today"
            message="New requests will show up under Requests."
            compact
          />
        ) : null}
        {today.data?.map((b) => (
          <Card key={b.id} onPress={() => navigation.navigate('RequestDetail', { bookingId: b.id })} style={styles.job}>
            <Text variant="h3">{formatTime(b.scheduled_at)}</Text>
            <View style={styles.flex}>
              <Text variant="label" numberOfLines={1}>
                {b.booking_items.map((i) => i.name).join(', ') || 'Booking'}
              </Text>
              <Text variant="caption" color="textMuted">
                {b.mode === 'home' ? 'At customer’s home' : 'At your studio'} · #{b.code}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      <Button title="Switch to customer mode" variant="outline" onPress={() => setActiveRole('customer')} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <Card style={styles.stat}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      {value === null ? <Skeleton width={60} height={22} /> : <Text variant="h2">{value}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, paddingVertical: spacing.xl },
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  stat: { flex: 1, gap: spacing.xs, padding: spacing.md },
  list: { gap: spacing.md, marginBottom: spacing.xl },
  job: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  flex: { flex: 1 },
});
