import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';

import { CalendarScreen } from '@/features/vendor-app/calendar/screens/CalendarScreen';
import { CatalogScreen } from '@/features/vendor-app/catalog/screens/CatalogScreen';
import { DashboardScreen } from '@/features/vendor-app/dashboard/screens/DashboardScreen';
import { EarningsScreen } from '@/features/vendor-app/earnings/screens/EarningsScreen';
import { RequestsScreen } from '@/features/vendor-app/requests/screens/RequestsScreen';
import { useIncomingRequests } from '@/features/vendor-app/requests/api';
import { colors } from '@/theme';
import type { VendorTabParamList } from '@/types/navigation';
import { tabScreenOptions } from './options';

const Tab = createBottomTabNavigator<VendorTabParamList>();

const ICONS: Record<keyof VendorTabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Dashboard: ['grid', 'grid-outline'],
  Requests: ['notifications', 'notifications-outline'],
  Calendar: ['calendar', 'calendar-outline'],
  Catalog: ['pricetags', 'pricetags-outline'],
  Earnings: ['wallet', 'wallet-outline'],
};

export function VendorTabs() {
  // Subscribed here (not in RequestsScreen) so the badge stays live on every tab.
  const requests = useIncomingRequests();
  const pending = (requests.data?.offers.length ?? 0) + (requests.data?.direct.length ?? 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarActiveTintColor: colors.secondary,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ tabBarBadge: pending > 0 ? pending : undefined, headerShown: true }}
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ headerShown: true }} />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: 'Services', headerShown: true, headerRight: () => <PortfolioButton /> }}
      />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: true }} />
    </Tab.Navigator>
  );
}

function PortfolioButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.navigate('Portfolio')}
      hitSlop={10}
      style={{ marginRight: 16 }}
      accessibilityLabel="Manage portfolio"
    >
      <Ionicons name="images-outline" size={22} color={colors.primary} />
    </Pressable>
  );
}
