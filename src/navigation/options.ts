import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors, fonts } from '@/theme';

export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSubtle,
  tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.serif, color: colors.text },
  headerShadowVisible: false,
};

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.serif, color: colors.text },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.background },
};
