import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ServiceMode } from '@/types/models';

export type SortOption = 'rating' | 'price_low' | 'price_high' | 'distance';

export type PriceRange = { min: number | null; max: number | null };

export type UserLocation = { lat: number; lng: number; label: string };

type FiltersState = {
  /** null = show vendors offering either mode. */
  mode: ServiceMode | null;
  price: PriceRange;
  sort: SortOption;
  verifiedOnly: boolean;
  /** Where the customer is browsing from; used for distance sorting and broadcast matching. */
  location: UserLocation | null;

  setMode: (mode: ServiceMode | null) => void;
  setPrice: (price: PriceRange) => void;
  setSort: (sort: SortOption) => void;
  setVerifiedOnly: (v: boolean) => void;
  setLocation: (location: UserLocation | null) => void;
  resetFilters: () => void;
};

const defaults = {
  mode: null,
  price: { min: null, max: null },
  sort: 'rating' as SortOption,
  verifiedOnly: false,
};

/** Active browse filters, shared by Home and Search so a choice on one carries to the other. */
export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...defaults,
      location: null,
      setMode: (mode) => set({ mode }),
      setPrice: (price) => set({ price }),
      setSort: (sort) => set({ sort }),
      setVerifiedOnly: (verifiedOnly) => set({ verifiedOnly }),
      setLocation: (location) => set({ location }),
      resetFilters: () => set(defaults),
    }),
    {
      name: 'gg-filters',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ location: s.location, mode: s.mode }),
    },
  ),
);

export const PRICE_PRESETS: { label: string; value: PriceRange }[] = [
  { label: 'Under ₹2k', value: { min: null, max: 2000 } },
  { label: '₹2k–₹10k', value: { min: 2000, max: 10000 } },
  { label: '₹10k–₹30k', value: { min: 10000, max: 30000 } },
  { label: '₹30k+', value: { min: 30000, max: null } },
];
