import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { BookingsScreen } from '@/features/bookings-list/screens/BookingsScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { ExploreScreen } from '@/features/search/screens/SearchResultsScreen';
import type { CustomerTabParamList } from '@/types/navigation';
import { tabScreenOptions } from './options';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const ICONS: Record<keyof CustomerTabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  Explore: ['search', 'search-outline'],
  Bookings: ['calendar', 'calendar-outline'],
  Profile: ['person', 'person-outline'],
};

export function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
