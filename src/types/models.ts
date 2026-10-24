/**
 * Domain aliases over the generated database types. Import from here in app code
 * (`import type { Vendor } from '@/types/models'`), not from ./database directly.
 */
import type { Database } from './database';

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type InsertTables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row'];
export type RpcArgs<T extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][T]['Args'];
export type RpcReturns<T extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][T]['Returns'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Vendor = Tables<'vendors'>;
export type Service = Tables<'services'>;
export type ServiceAddon = Tables<'service_addons'>;
export type PortfolioItem = Tables<'portfolio_items'>;
export type Address = Tables<'addresses'>;
export type Booking = Tables<'bookings'>;
export type BookingOffer = Tables<'booking_offers'>;
export type BookingEvent = Tables<'booking_events'>;
export type Message = Tables<'messages'>;
export type Review = Tables<'reviews'>;
export type Payout = Tables<'payouts'>;
export type VendorLocation = Tables<'vendor_locations'>;

/** Lightweight vendor shape used by every list (Home, search, favourites). */
export type VendorCard = Views<'vendor_cards'>;
export type VendorSearchResult = RpcReturns<'search_vendors'>[number];

export type UserRole = Enums<'user_role'>;
export type ServiceMode = Enums<'service_mode'>;
export type BookingStatus = Enums<'booking_status'>;
export type MatchType = Enums<'match_type'>;
export type PaymentMethod = Enums<'payment_method'>;
