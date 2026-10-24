import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorState, Rating, Screen, SectionHeader, Skeleton, Text, VerifiedBadge } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { RootStackScreenProps } from '@/types/navigation';
import { formatDuration, formatINR } from '@/utils/format';
import { useVendor, useVendorDetails, useVendorPortfolio, useVendorReviews, useVendorServices } from '../api';

/**
 * Vendor profile: trust signals first (verified, rating, jobs done), then portfolio,
 * packages/services and reviews. Tapping a service opens Service Detail.
 */
export function VendorProfileScreen({ route, navigation }: RootStackScreenProps<'VendorProfile'>) {
  const { vendorId } = route.params;
  const vendor = useVendor(vendorId);
  const details = useVendorDetails(vendorId);
  const services = useVendorServices(vendorId);
  const portfolio = useVendorPortfolio(vendorId);
  const reviews = useVendorReviews(vendorId, 5);

  if (vendor.isError) return <ErrorState error={vendor.error} onRetry={vendor.refetch} />;

  const v = vendor.data;

  return (
    <Screen scroll padded={false} edges={[]}>
      {v ? (
        <Image source={v.cover_url ?? v.avatar_url} style={styles.cover} contentFit="cover" transition={200} />
      ) : (
        <Skeleton height={200} borderRadius={0} />
      )}

      <View style={styles.body}>
        {/* Identity + trust */}
        <Card style={styles.identity}>
          {v ? (
            <>
              <View style={styles.row}>
                <Image source={v.avatar_url} style={styles.avatar} contentFit="cover" />
                <View style={styles.flex}>
                  <Text variant="h1">{v.business_name}</Text>
                  <Text variant="caption" color="textMuted">
                    {[v.area, v.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
              <View style={styles.trustRow}>
                {v.is_verified ? <VerifiedBadge /> : <Badge label="Not yet verified" tone="neutral" />}
                <Rating avg={v.rating_avg} count={v.rating_count} />
                <Text variant="caption" color="textMuted">
                  {v.completed_count} bookings · {v.years_experience} yrs exp
                </Text>
              </View>
              <View style={styles.trustRow}>
                {v.offers_home ? <Badge label="Comes to your home" icon="home-outline" tone="primary" /> : null}
                {v.offers_salon ? <Badge label="Studio / salon" icon="storefront-outline" /> : null}
              </View>
              {details.data?.bio ? <Text color="textMuted">{details.data.bio}</Text> : null}
              {details.data?.salon_address ? (
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Text variant="caption" color="textMuted" style={styles.flex}>
                    {details.data.salon_address}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.gap}>
              <Skeleton width="70%" height={24} />
              <Skeleton width="40%" height={14} />
            </View>
          )}
        </Card>

        {/* Portfolio */}
        <View>
          <SectionHeader title="Portfolio" />
          <FlatList
            horizontal
            data={portfolio.data ?? []}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gap}
            renderItem={({ item }) => (
              <Image source={item.image_url} style={styles.portfolioImage} contentFit="cover" transition={150} />
            )}
            ListEmptyComponent={
              portfolio.isPending ? <Skeleton width={140} height={140} borderRadius={radius.md} /> : null
            }
          />
        </View>

        {/* Services & packages */}
        <View>
          <SectionHeader title="Services & packages" />
          <View style={styles.gap}>
            {services.isPending ? <Skeleton height={80} borderRadius={radius.lg} /> : null}
            {services.data?.map((s) => (
              <Card
                key={s.id}
                onPress={() => navigation.navigate('ServiceDetail', { vendorId, serviceId: s.id })}
                accessibilityLabel={s.name}
              >
                <View style={styles.serviceRow}>
                  <View style={styles.flex}>
                    {s.is_package ? <Badge label="Package" icon="gift-outline" tone="primary" /> : null}
                    <Text variant="h3">{s.name}</Text>
                    <Text variant="caption" color="textMuted">
                      {formatDuration(s.duration_min)}
                      {s.service_addons.length ? ` · ${s.service_addons.length} add-ons` : ''}
                    </Text>
                  </View>
                  <View style={styles.prices}>
                    {s.price_home != null ? (
                      <Text variant="label" color="primary">
                        {formatINR(s.price_home)}{' '}
                        <Text variant="caption" color="textMuted">
                          home
                        </Text>
                      </Text>
                    ) : null}
                    {s.price_salon != null ? (
                      <Text variant="label">
                        {formatINR(s.price_salon)}{' '}
                        <Text variant="caption" color="textMuted">
                          salon
                        </Text>
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View>
          <SectionHeader title="Reviews" subtitle={v ? `${v.rating_count} reviews` : undefined} />
          {reviews.data?.length === 0 ? (
            <Text color="textMuted">No written reviews yet.</Text>
          ) : (
            <View style={styles.gap}>
              {reviews.data?.map((r) => (
                <Card key={r.id} style={styles.gap}>
                  <View style={styles.row}>
                    <Text variant="label" style={styles.flex}>
                      {r.reviewer_name ?? 'Customer'}
                    </Text>
                    <Text variant="label" color="star" accessibilityLabel={`${r.rating} out of 5 stars`}>
                      {'★'.repeat(r.rating)}
                      <Text variant="label" color="border">
                        {'★'.repeat(5 - r.rating)}
                      </Text>
                    </Text>
                  </View>
                  {r.comment ? <Text color="textMuted">{r.comment}</Text> : null}
                </Card>
              ))}
            </View>
          )}
        </View>

        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={styles.back}>
          <Text variant="label" color="secondary">
            Back to results
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 200, backgroundColor: colors.surfaceMuted },
  body: { paddingHorizontal: spacing.lg, gap: spacing.xl, marginTop: -spacing.xxl },
  identity: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  trustRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  gap: { gap: spacing.md },
  portfolioImage: { width: 140, height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prices: { alignItems: 'flex-end', gap: spacing.xxs },
  back: { alignSelf: 'center', padding: spacing.md },
});
