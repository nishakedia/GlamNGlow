import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { selectIsSignedIn, useAuthStore } from '@/store/authStore';

/**
 * Guests can browse freely; wrap any action that needs an account with this.
 *   const requireAuth = useRequireAuth();
 *   onPress={() => requireAuth(() => navigation.navigate('BookingDetails'))}
 */
export function useRequireAuth() {
  const navigation = useNavigation();
  const signedIn = useAuthStore(selectIsSignedIn);

  return useCallback(
    (action: () => void) => {
      if (signedIn) action();
      else navigation.navigate('PhoneLogin');
    },
    [navigation, signedIn],
  );
}
