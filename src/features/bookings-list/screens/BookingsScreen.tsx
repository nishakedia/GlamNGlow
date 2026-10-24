import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, Chip, ErrorState, Skeleton, StateView, Text } from '@/components';
import { selectIsSignedIn, useAuthStore } from '@/store/authStore';
import { colors, gutter, spacing } from '@/theme';
import type { BookingStatus } from '@/types/models';
import type { CustomerTabScreenProps } from '@/types/navigation';
import { formatDateTime, formatINR } from '@/utils/format';
import { useMyBookings, type BookingScope } from '../api';

const STATUS_LABEL: Record<BookingStatus, { label: string; tone: 'primary' | 'neutral' | 'success' | 'verified' }> = {
  requested: { label: 'Awaiting artist', tone: 'neutral' },
  broadcasting: { label: 'Finding artist', tone: 'neutral' },
  accepted: { label: 'Confirmed', tone: 'verified' },
  en_route: { label: 'On the way', tone: 'primary' },
  in_progress: { label: 'In progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  declined: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
};

export function BookingsScreen({ navigation }: CustomerTabScreenProps<'Bookings'>) {
  const signedIn = useAuthStore(selectIsSignedIn);
  const [scope, setScope] = useState<BookingScope>('upcoming');
  const bookings = useMyBookings(scope);

  if (!signedIn) {
    return (
      <SafeAreaView style={styles.root}>
        <StateView
          icon="calendar-outline"
          title="Your bookings live here"
          message="Sign in to see upcoming appointments and past bookings."
          actionLabel="Sign in"
          onAction={() => navigation.navigate('PhoneLogin')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={bookings.data ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={bookings.isRefetching} onRefresh={bookings.refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="h1">My bookings</Text>
            <View style={styles.tabs}>
              <Chip label="Upcoming" selected={scope === 'upcoming'} onPress={() => setScope('upcoming')} />
              <Chip label="Past" selected={scope === 'past'} onPress={() => setScope('past')} />
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const status = STATUS_LABEL[item.status];
          return (
            <Card
              onPress={() =>
                navigation.navigate(item.status === 'broadcasting' ? 'BroadcastWaiting' : 'Tracking', {
                  bookingId: item.id,
                })
              }
              style={styles.card}
            >
              <View style={styles.row}>
                <Text variant="h3" style={styles.flex} numberOfLines={1}>
                  {item.vendors?.business_name ?? `${item.categories?.name ?? 'Beauty'} request`}
                </Text>
                <Badge label={status.label} tone={status.tone} />
              </View>
              <View style={styles.row}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text variant="caption" color="textMuted" style={styles.flex}>
                  {formatDateTime(item.scheduled_at)} · {item.mode === 'home' ? 'At home' : 'At salon'}
                </Text>
                <Text variant="label">{formatINR(item.total)}</Text>
              </View>
              {item.status === 'completed' ? (
                <Text
                  variant="label"
                  color="secondary"
                  onPress={() => navigation.navigate('RateReview', { bookingId: item.id })}
                >
                  Rate & review
                </Text>
              ) : null}
            </Card>
          );
        }}
        ListEmptyComponent={
          bookings.isPending ? (
            <Skeleton height={90} />
          ) : bookings.isError ? (
            <ErrorState error={bookings.error} onRetry={bookings.refetch} />
          ) : (
            <StateView
              icon="calendar-outline"
              title={scope === 'upcoming' ? 'Nothing booked yet' : 'No past bookings'}
              actionLabel={scope === 'upcoming' ? 'Find an artist' : undefined}
              onAction={() => navigation.navigate('Home')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, paddingVertical: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
