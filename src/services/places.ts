import { env } from './env';

/**
 * Address search behind one interface so the provider can be swapped by env var.
 *
 * - "osm" (default, free, no key): Photon (komoot) for autocomplete, built on OpenStreetMap.
 *   Fair-use: debounce input (we use 350 ms) and don't hammer it from a server.
 * - "google": Google Places API (New). Better coverage in India but billed beyond the
 *   monthly free credit, so it's opt-in via EXPO_PUBLIC_PLACES_PROVIDER=google.
 */
export type PlaceSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  /** Present for OSM results; Google results need `resolvePlace` to get coordinates. */
  lat?: number;
  lng?: number;
};

export type ResolvedPlace = {
  lat: number;
  lng: number;
  line1: string;
  city: string;
  pincode?: string;
};

type Bias = { lat: number; lng: number } | null;

// ---------------------------------------------------------------- OSM / Photon
type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

async function osmSearch(query: string, bias: Bias): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q: query, limit: '8', lang: 'en' });
  if (bias) {
    params.set('lat', String(bias.lat));
    params.set('lon', String(bias.lng));
  }
  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) throw new Error('Address search is unavailable right now');
  const data = (await res.json()) as { features: PhotonFeature[] };
  return data.features
    .filter((f) => !f.properties.countrycode || f.properties.countrycode === 'IN')
    .map((f) => {
      const p = f.properties;
      const title = p.name ?? [p.housenumber, p.street].filter(Boolean).join(' ') ?? query;
      return {
        id: String(p.osm_id),
        title: title || query,
        subtitle: [p.locality ?? p.district, p.city, p.state, p.postcode].filter(Boolean).join(', '),
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      };
    });
}

async function osmReverse(lat: number, lng: number): Promise<ResolvedPlace> {
  const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`);
  const data = (await res.json()) as { features: PhotonFeature[] };
  const p = data.features[0]?.properties;
  return {
    lat,
    lng,
    line1: [p?.housenumber, p?.street ?? p?.name].filter(Boolean).join(' ') || 'Pinned location',
    city: p?.city ?? p?.district ?? '',
    pincode: p?.postcode,
  };
}

// ---------------------------------------------------------------- Google Places (New)
async function googleSearch(query: string, bias: Bias): Promise<PlaceSuggestion[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.googlePlacesKey ?? '' },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ['in'],
      ...(bias && {
        locationBias: { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 30000 } },
      }),
    }),
  });
  if (!res.ok) throw new Error('Address search is unavailable right now');
  const data = (await res.json()) as {
    suggestions?: {
      placePrediction: {
        placeId: string;
        structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } };
      };
    }[];
  };
  return (data.suggestions ?? []).map(({ placePrediction: p }) => ({
    id: p.placeId,
    title: p.structuredFormat.mainText.text,
    subtitle: p.structuredFormat.secondaryText?.text ?? '',
  }));
}

async function googleResolve(placeId: string): Promise<ResolvedPlace> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': env.googlePlacesKey ?? '',
      'X-Goog-FieldMask': 'location,shortFormattedAddress,addressComponents',
    },
  });
  const p = (await res.json()) as {
    location: { latitude: number; longitude: number };
    shortFormattedAddress: string;
    addressComponents: { longText: string; types: string[] }[];
  };
  const part = (type: string) => p.addressComponents.find((c) => c.types.includes(type))?.longText;
  return {
    lat: p.location.latitude,
    lng: p.location.longitude,
    line1: p.shortFormattedAddress,
    city: part('locality') ?? part('administrative_area_level_2') ?? '',
    pincode: part('postal_code'),
  };
}

// ---------------------------------------------------------------- Public API
const useGoogle = env.placesProvider === 'google' && !!env.googlePlacesKey;

export function searchPlaces(query: string, bias: Bias = null): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 3) return Promise.resolve([]);
  return useGoogle ? googleSearch(query, bias) : osmSearch(query, bias);
}

export async function resolvePlace(s: PlaceSuggestion): Promise<ResolvedPlace> {
  if (s.lat != null && s.lng != null) {
    const r = await osmReverse(s.lat, s.lng);
    return { ...r, line1: s.title };
  }
  return googleResolve(s.id);
}

/** Free reverse geocoding for "use my current location" (works for both providers). */
export function reverseGeocode(lat: number, lng: number): Promise<ResolvedPlace> {
  return osmReverse(lat, lng);
}
