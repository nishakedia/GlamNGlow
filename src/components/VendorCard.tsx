import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { VendorCard as VendorCardRow } from '@/types/models';
import { formatDistance, formatINR } from '@/utils/format';
import { Badge, VerifiedBadge } from './Badge';
import { Card } from './Card';
import { Rating } from './Rating';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

/** Fields shared by the `vendor_cards` view and the `search_vendors` RPC. */
export type VendorCardData = Pick<
  VendorCardRow,
  | 'id'
  | 'business_name'
  | 'avatar_url'
  | 'cover_url'
  | 'city'
  | 'area'
  | 'offers_home'
  | 'offers_salon'
  | 'is_verified'
  | 'rating_avg'
  | 'rating_count'
  | 'starting_price'
  | 'category_names'
> & { distance_km?: number | null };

type Props = {
  vendor: VendorCardData;
  onPress: (vendorId: string) => void;
};

function VendorCardComponent({ vendor, onPress }: Props) {
  const distance = formatDistance(vendor.distance_km);
  const location = [vendor.area, vendor.city].filter(Boolean).join(', ');

  return (
    <Card
      padded={false}
      onPress={() => onPress(vendor.id)}
      accessibilityLabel={`${vendor.business_name}${vendor.is_verified ? ', verified' : ''}`}
      style={styles.card}
    >
      <View>
        <Image
          source={vendor.cover_url ?? vendor.avatar_url}
          style={styles.cover}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          accessibilityIgnoresInvertColors
        />
        {vendor.is_verified ? (
          <View style={styles.verifiedOnCover}>
            <VerifiedBadge />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Image source={vendor.avatar_url} style={styles.avatar} contentFit="cover" />
          <View style={styles.flex}>
            <Text variant="h3" numberOfLines={1}>
              {vendor.business_name}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {vendor.category_names.join(' · ')}
            </Text>
          </View>
          <Rating avg={vendor.rating_avg} count={vendor.rating_count} />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.flex}>
            {distance ? `${distance} · ${location}` : location}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.badges}>
            {vendor.offers_home ? <Badge label="At home" icon="home-outline" tone="primary" /> : null}
            {vendor.offers_salon ? <Badge label="At salon" icon="storefront-outline" tone="neutral" /> : null}
          </View>
          {vendor.starting_price != null ? (
            <Text variant="caption" color="textMuted">
              from{' '}
              <Text variant="label" color="primary">
                {formatINR(vendor.starting_price)}
              </Text>
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export const VendorCard = memo(VendorCardComponent);

export function VendorCardSkeleton() {
  return (
    <Card padded={false} style={styles.card}>
      <Skeleton height={140} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="80%" height={12} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  cover: { width: '100%', height: 140, backgroundColor: colors.surfaceMuted },
  verifiedOnCover: { position: 'absolute', top: spacing.md, left: spacing.md },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.surface,
    marginTop: -30,
  },
  flex: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badges: { flexDirection: 'row', gap: spacing.xs },
});
