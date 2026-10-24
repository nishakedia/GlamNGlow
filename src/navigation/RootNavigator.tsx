import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PhoneLoginScreen } from '@/features/auth/screens/PhoneLoginScreen';
import { VerifyOtpScreen } from '@/features/auth/screens/VerifyOtpScreen';
import { AddressPickerScreen } from '@/features/booking/screens/AddressPickerScreen';
import { BookingDetailsScreen } from '@/features/booking/screens/BookingDetailsScreen';
import { BroadcastRequestScreen } from '@/features/booking/screens/BroadcastRequestScreen';
import { BroadcastWaitingScreen } from '@/features/booking/screens/BroadcastWaitingScreen';
import { OrderReviewScreen } from '@/features/booking/screens/OrderReviewScreen';
import { RateReviewScreen } from '@/features/bookings-list/screens/RateReviewScreen';
import { BookingConfirmationScreen } from '@/features/payment/screens/BookingConfirmationScreen';
import { PaymentScreen } from '@/features/payment/screens/PaymentScreen';
import { SearchResultsScreen } from '@/features/search/screens/SearchResultsScreen';
import { ChatScreen } from '@/features/tracking/screens/ChatScreen';
import { TrackingScreen } from '@/features/tracking/screens/TrackingScreen';
import { VendorKycScreen } from '@/features/vendor-app/onboarding/screens/VendorKycScreen';
import { VendorSetupScreen } from '@/features/vendor-app/onboarding/screens/VendorSetupScreen';
import { VendorSignupScreen } from '@/features/vendor-app/onboarding/screens/VendorSignupScreen';
import { VendorUnderReviewScreen } from '@/features/vendor-app/onboarding/screens/VendorUnderReviewScreen';
import { PortfolioScreen } from '@/features/vendor-app/portfolio/screens/PortfolioScreen';
import { RequestDetailScreen } from '@/features/vendor-app/requests/screens/RequestDetailScreen';
import { ServiceDetailScreen } from '@/features/vendor-profile/screens/ServiceDetailScreen';
import { VendorProfileScreen } from '@/features/vendor-profile/screens/VendorProfileScreen';
import { useAuthStore } from '@/store/authStore';
import type { RootStackParamList } from '@/types/navigation';
import { CustomerTabs } from './CustomerTabs';
import { stackScreenOptions } from './options';
import { VendorTabs } from './VendorTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Role switching happens here. Only one tab shell is registered at a time, chosen by
 * `activeRole` (and only if the user actually owns a vendor account). Switching role
 * swaps the shell and React Navigation resets to its first tab automatically.
 */
export function RootNavigator() {
  const isVendorMode = useAuthStore((s) => s.activeRole === 'vendor' && s.vendorId !== null && s.session !== null);
  const signedIn = useAuthStore((s) => s.session !== null);

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {isVendorMode ? (
        <Stack.Screen name="VendorTabs" component={VendorTabs} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} options={{ headerShown: false }} />
      )}

      {/* Customer flow — reachable by guests until an action needs an account */}
      <Stack.Group>
        <Stack.Screen
          name="SearchResults"
          component={SearchResultsScreen}
          options={({ route }) => ({ title: route.params.title ?? 'Search' })}
        />
        <Stack.Screen
          name="VendorProfile"
          component={VendorProfileScreen}
          options={{ title: '', headerTransparent: true }}
        />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Service' }} />
      </Stack.Group>

      {/* Screens that require a session */}
      {signedIn ? (
        <Stack.Group>
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Choose a time' }} />
          <Stack.Screen
            name="AddressPicker"
            component={AddressPickerScreen}
            options={{ title: 'Address', presentation: 'modal' }}
          />
          <Stack.Screen name="OrderReview" component={OrderReviewScreen} options={{ title: 'Review' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
          <Stack.Screen
            name="BookingConfirmation"
            component={BookingConfirmationScreen}
            options={{ title: 'Confirmed', headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="BroadcastRequest"
            component={BroadcastRequestScreen}
            options={{ title: 'Request artists' }}
          />
          <Stack.Screen
            name="BroadcastWaiting"
            component={BroadcastWaitingScreen}
            options={{ title: 'Matching', gestureEnabled: false }}
          />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Your booking' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
          <Stack.Screen name="RateReview" component={RateReviewScreen} options={{ title: 'Rate & review' }} />

          <Stack.Screen name="VendorSignup" component={VendorSignupScreen} options={{ title: 'Become an artist' }} />
          <Stack.Screen name="VendorKyc" component={VendorKycScreen} options={{ title: 'Verification' }} />
          <Stack.Screen name="VendorSetup" component={VendorSetupScreen} options={{ title: 'Set up your studio' }} />
          <Stack.Screen name="VendorUnderReview" component={VendorUnderReviewScreen} options={{ title: 'Status' }} />
          <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: 'Portfolio' }} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Job' }} />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} options={{ title: 'Sign in' }} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ title: 'Verify' }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
