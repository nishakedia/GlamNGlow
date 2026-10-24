import { create } from 'zustand';

import type { MatchType, PaymentMethod, ServiceMode } from '@/types/models';

/**
 * The booking being assembled across Service Detail → Booking Details → Order Review.
 * Nothing is written to the server until `create_booking` runs on Order Review,
 * so abandoning the flow leaves no half-created rows behind.
 */
export type BookingDraft = {
  matchType: MatchType;
  categoryId: string | null;
  categorySlug: string | null;
  vendorId: string | null;
  serviceId: string | null;
  addonIds: string[];
  mode: ServiceMode;
  /** ISO date (yyyy-mm-dd) chosen on the calendar. */
  date: string | null;
  /** ISO timestamp of the chosen slot. */
  scheduledAt: string | null;
  addressId: string | null;
  notes: string;
  paymentMethod: PaymentMethod;
  /** Broadcast only. */
  budget: number | null;
  durationMin: number | null;
};

type DraftState = BookingDraft & {
  startDirect: (args: { vendorId: string; serviceId: string; categoryId: string; mode: ServiceMode }) => void;
  startBroadcast: (args: { categoryId: string; categorySlug: string; mode: ServiceMode }) => void;
  update: (patch: Partial<BookingDraft>) => void;
  toggleAddon: (addonId: string) => void;
  clear: () => void;
};

const empty: BookingDraft = {
  matchType: 'direct',
  categoryId: null,
  categorySlug: null,
  vendorId: null,
  serviceId: null,
  addonIds: [],
  mode: 'home',
  date: null,
  scheduledAt: null,
  addressId: null,
  notes: '',
  paymentMethod: 'online',
  budget: null,
  durationMin: null,
};

export const useBookingDraftStore = create<DraftState>()((set) => ({
  ...empty,
  startDirect: ({ vendorId, serviceId, categoryId, mode }) =>
    set({ ...empty, matchType: 'direct', vendorId, serviceId, categoryId, mode }),
  startBroadcast: ({ categoryId, categorySlug, mode }) =>
    set({ ...empty, matchType: 'broadcast', categoryId, categorySlug, mode, durationMin: 90 }),
  update: (patch) => set(patch),
  toggleAddon: (addonId) =>
    set((s) => ({
      addonIds: s.addonIds.includes(addonId) ? s.addonIds.filter((id) => id !== addonId) : [...s.addonIds, addonId],
    })),
  clear: () => set(empty),
}));
