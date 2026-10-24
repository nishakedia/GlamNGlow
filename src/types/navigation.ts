import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type CustomerTabParamList = {
  Home: undefined;
  Explore: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type VendorTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  Calendar: undefined;
  Catalog: undefined;
  Earnings: undefined;
};

/**
 * Every screen that can be pushed on top of the tabs lives in the root stack,
 * so any screen can navigate to any other with a single typed `navigate` call.
 */
export type RootStackParamList = {
  // Role-switched tab shells (only one is mounted at a time)
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  VendorTabs: NavigatorScreenParams<VendorTabParamList> | undefined;

  // Auth (presented as a modal so guests can browse first)
  PhoneLogin: { redirectTo?: keyof RootStackParamList } | undefined;
  VerifyOtp: { channel: 'phone' | 'email'; target: string };

  // Customer booking flow
  SearchResults: { categorySlug?: string; query?: string; title?: string };
  VendorProfile: { vendorId: string };
  ServiceDetail: { vendorId: string; serviceId: string };
  BookingDetails: undefined; // reads the draft from useBookingDraftStore
  AddressPicker: undefined;
  OrderReview: undefined;
  Payment: { bookingId: string };
  BookingConfirmation: { bookingId: string };
  BroadcastRequest: { categorySlug?: string };
  BroadcastWaiting: { bookingId: string };
  Tracking: { bookingId: string };
  Chat: { bookingId: string };
  RateReview: { bookingId: string };

  // Vendor onboarding + extra vendor screens
  VendorSignup: undefined;
  VendorKyc: undefined;
  VendorSetup: undefined;
  VendorUnderReview: undefined;
  Portfolio: undefined;
  RequestDetail: { bookingId: string; offerId?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type CustomerTabScreenProps<T extends keyof CustomerTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type VendorTabScreenProps<T extends keyof VendorTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<VendorTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // Lets `useNavigation()` infer routes without passing generics everywhere.
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
