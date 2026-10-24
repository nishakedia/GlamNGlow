/**
 * Database types for the Supabase client.
 *
 * Hand-written to mirror supabase/migrations. Once your project exists, regenerate
 * the exact types with:
 *
 *   npm run db:types
 *
 * which overwrites this file (the domain aliases live in ./models.ts, so nothing is lost).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Builds the Row/Insert/Update triple the generated types use. `O` = columns optional on insert. */
type TableDef<R, O extends keyof R, Rels extends Rel[] = []> = {
  Row: R;
  Insert: Omit<R, O> & Partial<Pick<R, O>>;
  Update: Partial<R>;
  Relationships: Rels;
};

export type UserRole = 'customer' | 'vendor' | 'admin';
export type ServiceMode = 'home' | 'salon';
export type VendorStatus = 'draft' | 'kyc_pending' | 'under_review' | 'live' | 'suspended' | 'rejected';
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type MatchType = 'direct' | 'broadcast';
export type BookingStatus =
  | 'requested'
  | 'broadcasting'
  | 'accepted'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined'
  | 'expired';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'lost' | 'expired';
export type PaymentMethod = 'online' | 'pay_at_service';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type PayoutStatus = 'scheduled' | 'processing' | 'paid' | 'failed';

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  icon: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type VendorRow = {
  id: string;
  owner_id: string | null;
  business_name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string;
  area: string | null;
  salon_address: string | null;
  lat: number | null;
  lng: number | null;
  location: unknown | null;
  offers_home: boolean;
  offers_salon: boolean;
  service_radius_km: number;
  years_experience: number;
  languages: string[];
  is_verified: boolean;
  status: VendorStatus;
  rating_avg: number;
  rating_count: number;
  completed_count: number;
  starting_price: number | null;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_home: number | null;
  price_salon: number | null;
  is_package: boolean;
  includes: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type ServiceAddonRow = {
  id: string;
  service_id: string;
  name: string;
  price: number;
  duration_min: number;
};

type PortfolioItemRow = {
  id: string;
  vendor_id: string;
  category_id: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

type VendorKycRow = {
  vendor_id: string;
  id_doc_type: string;
  id_doc_path: string;
  selfie_path: string;
  match_score: number | null;
  status: KycStatus;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

type VendorAvailabilityRow = {
  id: string;
  vendor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

type VendorTimeOffRow = {
  id: string;
  vendor_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  pincode: string | null;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
};

type FavoriteRow = { user_id: string; vendor_id: string; created_at: string };

type BookingRow = {
  id: string;
  code: string;
  customer_id: string;
  vendor_id: string | null;
  category_id: string;
  service_id: string | null;
  match_type: MatchType;
  mode: ServiceMode;
  status: BookingStatus;
  scheduled_at: string;
  duration_min: number;
  address: Json | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  subtotal: number;
  addons_total: number;
  travel_fee: number;
  platform_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  broadcast_expires_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
};

type BookingItemRow = {
  id: string;
  booking_id: string;
  service_id: string | null;
  addon_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
};

type BookingOfferRow = {
  id: string;
  booking_id: string;
  vendor_id: string;
  distance_km: number | null;
  status: OfferStatus;
  created_at: string;
  responded_at: string | null;
};

type BookingEventRow = {
  id: number;
  booking_id: string;
  status: BookingStatus;
  actor_id: string | null;
  note: string | null;
  created_at: string;
};

type VendorLocationRow = {
  booking_id: string;
  vendor_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  updated_at: string;
};

type MessageRow = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  booking_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  raw: Json | null;
  created_at: string;
  updated_at: string;
};

type ReviewRow = {
  id: string;
  booking_id: string;
  customer_id: string;
  vendor_id: string;
  rating: number;
  reviewer_name: string | null;
  comment: string | null;
  photo_urls: string[];
  created_at: string;
};

type PayoutRow = {
  id: string;
  vendor_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: PayoutStatus;
  reference: string | null;
  created_at: string;
};

type PushTokenRow = { token: string; user_id: string; platform: string; updated_at: string };

type VendorCardRow = {
  id: string;
  business_name: string;
  slug: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  offers_home: boolean;
  offers_salon: boolean;
  is_verified: boolean;
  status: VendorStatus;
  rating_avg: number;
  rating_count: number;
  completed_count: number;
  starting_price: number | null;
  years_experience: number;
  category_slugs: string[];
  category_names: string[];
};

type SearchVendorRow = Omit<VendorCardRow, 'lat' | 'lng' | 'status'> & { distance_km: number | null };

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        'full_name' | 'phone' | 'email' | 'avatar_url' | 'role' | 'created_at' | 'updated_at'
      >;
      categories: TableDef<CategoryRow, 'id' | 'tagline' | 'image_url' | 'sort_order' | 'is_active'>;
      vendors: TableDef<
        VendorRow,
        | 'id'
        | 'owner_id'
        | 'slug'
        | 'bio'
        | 'avatar_url'
        | 'cover_url'
        | 'area'
        | 'salon_address'
        | 'lat'
        | 'lng'
        | 'location'
        | 'offers_home'
        | 'offers_salon'
        | 'service_radius_km'
        | 'years_experience'
        | 'languages'
        | 'is_verified'
        | 'status'
        | 'rating_avg'
        | 'rating_count'
        | 'completed_count'
        | 'starting_price'
        | 'created_at'
        | 'updated_at'
      >;
      vendor_categories: TableDef<
        { vendor_id: string; category_id: string },
        never,
        [
          {
            foreignKeyName: 'vendor_categories_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendor_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ]
      >;
      services: TableDef<
        ServiceRow,
        | 'id'
        | 'description'
        | 'price_home'
        | 'price_salon'
        | 'is_package'
        | 'includes'
        | 'image_url'
        | 'is_active'
        | 'sort_order'
        | 'created_at',
        [
          {
            foreignKeyName: 'services_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'services_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ]
      >;
      service_addons: TableDef<
        ServiceAddonRow,
        'id' | 'duration_min',
        [
          {
            foreignKeyName: 'service_addons_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ]
      >;
      portfolio_items: TableDef<PortfolioItemRow, 'id' | 'category_id' | 'caption' | 'sort_order' | 'created_at'>;
      vendor_kyc: TableDef<
        VendorKycRow,
        'match_score' | 'status' | 'reviewer_notes' | 'reviewed_by' | 'submitted_at' | 'reviewed_at',
        [
          {
            foreignKeyName: 'vendor_kyc_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: true;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
        ]
      >;
      vendor_availability: TableDef<VendorAvailabilityRow, 'id'>;
      vendor_time_off: TableDef<VendorTimeOffRow, 'id' | 'reason'>;
      addresses: TableDef<AddressRow, 'id' | 'label' | 'line2' | 'landmark' | 'pincode' | 'is_default' | 'created_at'>;
      favorites: TableDef<FavoriteRow, 'created_at'>;
      bookings: TableDef<
        BookingRow,
        | 'id'
        | 'code'
        | 'vendor_id'
        | 'service_id'
        | 'address'
        | 'lat'
        | 'lng'
        | 'notes'
        | 'subtotal'
        | 'addons_total'
        | 'travel_fee'
        | 'platform_fee'
        | 'total'
        | 'payment_status'
        | 'broadcast_expires_at'
        | 'cancelled_reason'
        | 'created_at'
        | 'updated_at',
        [
          {
            foreignKeyName: 'bookings_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ]
      >;
      booking_items: TableDef<
        BookingItemRow,
        'id' | 'service_id' | 'addon_id' | 'quantity',
        [
          {
            foreignKeyName: 'booking_items_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ]
      >;
      booking_offers: TableDef<
        BookingOfferRow,
        'id' | 'distance_km' | 'status' | 'created_at' | 'responded_at',
        [
          {
            foreignKeyName: 'booking_offers_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ]
      >;
      booking_events: TableDef<BookingEventRow, 'id' | 'actor_id' | 'note' | 'created_at'>;
      vendor_locations: TableDef<VendorLocationRow, 'heading' | 'updated_at'>;
      messages: TableDef<MessageRow, 'id' | 'body' | 'image_path' | 'created_at'>;
      payments: TableDef<
        PaymentRow,
        | 'id'
        | 'razorpay_order_id'
        | 'razorpay_payment_id'
        | 'currency'
        | 'status'
        | 'method'
        | 'raw'
        | 'created_at'
        | 'updated_at',
        [
          {
            foreignKeyName: 'payments_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ]
      >;
      reviews: TableDef<
        ReviewRow,
        'id' | 'reviewer_name' | 'comment' | 'photo_urls' | 'created_at',
        [
          {
            foreignKeyName: 'reviews_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ]
      >;
      payouts: TableDef<PayoutRow, 'id' | 'status' | 'reference' | 'created_at'>;
      push_tokens: TableDef<PushTokenRow, 'updated_at'>;
    };
    Views: {
      vendor_cards: { Row: VendorCardRow; Relationships: [] };
    };
    Functions: {
      get_available_slots: {
        Args: { p_vendor_id: string; p_date: string; p_duration_min: number };
        Returns: { slot_start: string }[];
      };
      quote_booking: {
        Args: { p_service_id: string; p_mode: ServiceMode; p_addon_ids?: string[] };
        Returns: {
          subtotal: number;
          addons_total: number;
          travel_fee: number;
          platform_fee: number;
          total: number;
          duration_min: number;
        }[];
      };
      create_booking: {
        Args: {
          p_match_type: MatchType;
          p_mode: ServiceMode;
          p_category_id: string;
          p_scheduled_at: string;
          p_payment_method: PaymentMethod;
          p_vendor_id?: string;
          p_service_id?: string;
          p_addon_ids?: string[];
          p_budget?: number;
          p_duration_min?: number;
          p_address_id?: string;
          p_lat?: number;
          p_lng?: number;
          p_notes?: string;
        };
        Returns: BookingRow;
      };
      respond_to_offer: { Args: { p_offer_id: string; p_accept: boolean }; Returns: boolean };
      respond_to_booking: { Args: { p_booking_id: string; p_accept: boolean }; Returns: BookingRow };
      advance_booking: { Args: { p_booking_id: string; p_status: BookingStatus }; Returns: BookingRow };
      cancel_booking: { Args: { p_booking_id: string; p_reason?: string }; Returns: BookingRow };
      search_vendors: {
        Args: {
          p_category_slug?: string;
          p_query?: string;
          p_mode?: ServiceMode;
          p_min_price?: number;
          p_max_price?: number;
          p_lat?: number;
          p_lng?: number;
          p_radius_km?: number;
          p_verified_only?: boolean;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: SearchVendorRow[];
      };
      vendor_earnings_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          today_bookings: number;
          today_earnings: number;
          week_earnings: number;
          month_earnings: number;
          pending_payout: number;
        }[];
      };
      admin_review_vendor: {
        Args: { p_vendor_id: string; p_approve: boolean; p_notes?: string };
        Returns: VendorRow;
      };
      my_vendor_id: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      user_role: UserRole;
      service_mode: ServiceMode;
      vendor_status: VendorStatus;
      kyc_status: KycStatus;
      match_type: MatchType;
      booking_status: BookingStatus;
      offer_status: OfferStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
