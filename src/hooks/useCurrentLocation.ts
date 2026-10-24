import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { reverseGeocode } from '@/services/places';
import { useFiltersStore } from '@/store/filtersStore';

/**
 * Asks for foreground location once and stores "lat/lng + area label" in the
 * filters store, where Home, Search and broadcast matching all read it.
 */
export function useCurrentLocation() {
  const setLocation = useFiltersStore((s) => s.setLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      let label = 'Current location';
      try {
        const place = await reverseGeocode(lat, lng);
        label = place.city ? `${place.line1}, ${place.city}` : place.line1;
      } catch {
        // Label is cosmetic; keep the coordinates even if reverse geocoding fails.
      }
      const location = { lat, lng, label };
      setLocation(location);
      return location;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  return { detect, loading, error };
}
