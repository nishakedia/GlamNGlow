import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // most marketplace data is fine to show for a minute before refetching
      gcTime: 10 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// React Native has no window focus/online events; wire React Query to AppState instead.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  onlineManager.setOnline(true);
}

/**
 * Query key factory. Every feature's api.ts builds keys from here so
 * invalidation stays consistent (e.g. invalidate `qk.bookings.all` after paying).
 */
export const qk = {
  categories: ['categories'] as const,
  vendors: {
    all: ['vendors'] as const,
    top: (filters: object) => ['vendors', 'top', filters] as const,
    search: (filters: object) => ['vendors', 'search', filters] as const,
    detail: (id: string) => ['vendors', 'detail', id] as const,
    services: (id: string) => ['vendors', id, 'services'] as const,
    portfolio: (id: string) => ['vendors', id, 'portfolio'] as const,
    reviews: (id: string) => ['vendors', id, 'reviews'] as const,
    slots: (id: string, date: string, duration: number) => ['vendors', id, 'slots', date, duration] as const,
  },
  service: (id: string) => ['service', id] as const,
  quote: (args: object) => ['quote', args] as const,
  addresses: ['addresses'] as const,
  favorites: ['favorites'] as const,
  bookings: {
    all: ['bookings'] as const,
    mine: (scope: string) => ['bookings', 'mine', scope] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    events: (id: string) => ['bookings', id, 'events'] as const,
    messages: (id: string) => ['bookings', id, 'messages'] as const,
    location: (id: string) => ['bookings', id, 'location'] as const,
  },
  profile: ['profile'] as const,
  vendorApp: {
    me: ['vendor-app', 'me'] as const,
    summary: ['vendor-app', 'summary'] as const,
    today: ['vendor-app', 'today'] as const,
    requests: ['vendor-app', 'requests'] as const,
    calendar: (month: string) => ['vendor-app', 'calendar', month] as const,
    availability: ['vendor-app', 'availability'] as const,
    services: ['vendor-app', 'services'] as const,
    portfolio: ['vendor-app', 'portfolio'] as const,
    payouts: ['vendor-app', 'payouts'] as const,
  },
};
