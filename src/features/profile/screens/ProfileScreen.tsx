import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components';
import { useSignOut } from '@/features/auth/api';
import { useMyVendor } from '@/features/vendor-app/onboarding/api';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing } from '@/theme';
import type { CustomerTabScreenProps } from '@/types/navigation';

export function ProfileScreen({ navigation }: CustomerTabScreenProps<'Profile'>) {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const myVendor = useMyVendor();
  const signOut = useSignOut();

  if (!session) {
    return (
      <Screen>
        <View style={styles.guest}>
          <Text variant="display">Profile</Text>
          <Text color="textMuted">Sign in to manage bookings, addresses and saved artists.</Text>
          <Button title="Sign in with phone" onPress={() => navigation.navigate('PhoneLogin')} />
        </View>
      </Screen>
    );
  }

  const vendor = myVendor.data;

  // Role switching happens here: flipping activeRole swaps the whole tab shell in RootNavigator.
  const onArtistMode = () => {
    if (!vendor) return navigation.navigate('VendorSignup');
    if (vendor.status === 'live') return setActiveRole('vendor');
    if (vendor.status === 'draft') return navigation.navigate('VendorKyc');
    return navigation.navigate('VendorUnderReview');
  };

  const artistLabel = !vendor
    ? 'Become a Glam & Glow artist'
    : vendor.status === 'live'
      ? 'Switch to artist mode'
      : 'Continue artist onboarding';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="h1">{profile?.full_name ?? 'Your profile'}</Text>
          <Text color="textMuted">{session.user.phone ? `+${session.user.phone}` : session.user.email}</Text>
        </View>
      </View>

      <Card padded={false} style={styles.menu}>
        <MenuItem icon="calendar-outline" label="My bookings" onPress={() => navigation.navigate('Bookings')} />
        <MenuItem
          icon="location-outline"
          label="Saved addresses"
          onPress={() => navigation.navigate('AddressPicker')}
        />
        <MenuItem icon="sparkles-outline" label={artistLabel} onPress={onArtistMode} highlight />
      </Card>

      <Button title="Sign out" variant="ghost" onPress={() => signOut.mutate()} loading={signOut.isPending} />
    </Screen>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={highlight ? colors.secondary : colors.text} />
      <Text variant="bodyMedium" color={highlight ? 'secondary' : 'text'} style={styles.flex}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guest: { gap: spacing.lg, paddingTop: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  menu: { marginBottom: spacing.xl, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
