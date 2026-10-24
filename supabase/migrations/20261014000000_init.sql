-- =============================================================================
-- Glam & Glow — initial schema
-- Apply with `npx supabase db push` or paste into Supabase → SQL Editor.
-- See docs/BACKEND.md for an explanation of every table, policy and function.
-- =============================================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role      as enum ('customer', 'vendor', 'admin');
create type public.service_mode   as enum ('home', 'salon');
create type public.vendor_status  as enum ('draft', 'kyc_pending', 'under_review', 'live', 'suspended', 'rejected');
create type public.kyc_status     as enum ('pending', 'approved', 'rejected');
create type public.match_type     as enum ('direct', 'broadcast');
create type public.booking_status as enum (
  'requested',     -- direct booking waiting for the chosen vendor
  'broadcasting',  -- broadcast booking waiting for the first nearby vendor to accept
  'accepted',
  'en_route',
  'in_progress',
  'completed',
  'cancelled',
  'declined',      -- direct booking declined by the vendor
  'expired'        -- nobody accepted within the window
);
create type public.offer_status   as enum ('pending', 'accepted', 'declined', 'lost', 'expired');
create type public.payment_method as enum ('online', 'pay_at_service');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.payout_status  as enum ('scheduled', 'processing', 'paid', 'failed');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  avatar_url  text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, email)
  values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- -----------------------------------------------------------------------------
-- Catalog: categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline     text,
  icon        text not null,          -- Ionicons glyph name rendered by the app
  image_url   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

-- -----------------------------------------------------------------------------
-- Vendors (artists / salons)
-- -----------------------------------------------------------------------------
create table public.vendors (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid unique references public.profiles (id) on delete set null, -- null for seeded demo vendors
  business_name     text not null,
  slug              text unique,
  bio               text,
  avatar_url        text,
  cover_url         text,
  city              text not null,
  area              text,
  salon_address     text,
  lat               double precision,
  lng               double precision,
  location          extensions.geography(point, 4326)
                      generated always as (
                        case when lat is null or lng is null then null
                        else extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography end
                      ) stored,
  offers_home       boolean not null default true,
  offers_salon      boolean not null default false,
  service_radius_km int not null default 15,
  years_experience  int not null default 0,
  languages         text[] not null default '{}',
  is_verified       boolean not null default false,
  status            public.vendor_status not null default 'draft',
  rating_avg        numeric(2,1) not null default 0,
  rating_count      int not null default 0,
  completed_count   int not null default 0,
  starting_price    int,                -- cached min(service price) in INR, maintained by trigger
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index vendors_location_idx on public.vendors using gist (location);
create index vendors_status_rating_idx on public.vendors (status, rating_avg desc);
create index vendors_name_trgm_idx on public.vendors using gin (business_name extensions.gin_trgm_ops);
create trigger vendors_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();

create table public.vendor_categories (
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (vendor_id, category_id)
);
create index vendor_categories_category_idx on public.vendor_categories (category_id);

create or replace function public.owns_vendor(p_vendor_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendors where id = p_vendor_id and owner_id = auth.uid());
$$;

create or replace function public.my_vendor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.vendors where owner_id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Services, add-ons, packages
-- -----------------------------------------------------------------------------
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors (id) on delete cascade,
  category_id   uuid not null references public.categories (id),
  name          text not null,
  description   text,
  duration_min  int not null check (duration_min > 0),
  price_home    int check (price_home >= 0),    -- INR; null = not offered at home
  price_salon   int check (price_salon >= 0),   -- INR; null = not offered at salon
  is_package    boolean not null default false, -- bridal packages etc.
  includes      text[] not null default '{}',   -- bullet list for packages
  image_url     text,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  check (price_home is not null or price_salon is not null)
);
create index services_vendor_idx on public.services (vendor_id) where is_active;

create table public.service_addons (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references public.services (id) on delete cascade,
  name          text not null,
  price         int not null check (price >= 0),
  duration_min  int not null default 0
);

-- Keep vendors.starting_price in sync so list screens never need an aggregate.
create or replace function public.refresh_vendor_starting_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.vendors set starting_price = (
    select min(least(coalesce(price_home, price_salon), coalesce(price_salon, price_home)))
    from public.services where vendor_id = v and is_active
  ) where id = v;
  return null;
end $$;
create trigger services_starting_price
  after insert or update or delete on public.services
  for each row execute function public.refresh_vendor_starting_price();

-- -----------------------------------------------------------------------------
-- Portfolio & KYC
-- -----------------------------------------------------------------------------
create table public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  category_id  uuid references public.categories (id),
  image_url    text not null,
  caption      text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index portfolio_vendor_idx on public.portfolio_items (vendor_id);

create table public.vendor_kyc (
  vendor_id      uuid primary key references public.vendors (id) on delete cascade,
  id_doc_type    text not null,           -- aadhaar | pan | passport | dl
  id_doc_path    text not null,           -- path in private `kyc` bucket
  selfie_path    text not null,           -- path in private `kyc` bucket
  match_score    numeric,                 -- filled by a face-match provider if you add one
  status         public.kyc_status not null default 'pending',
  reviewer_notes text,
  reviewed_by    uuid references public.profiles (id),
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz
);

-- -----------------------------------------------------------------------------
-- Availability
-- -----------------------------------------------------------------------------
create table public.vendor_availability (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

create table public.vendor_time_off (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  check (ends_at > starts_at)
);

-- -----------------------------------------------------------------------------
-- Customer addresses & favourites
-- -----------------------------------------------------------------------------
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null default 'Home',
  line1       text not null,
  line2       text,
  landmark    text,
  city        text not null,
  pincode     text,
  lat         double precision not null,
  lng         double precision not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

create table public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);

-- -----------------------------------------------------------------------------
-- Bookings
-- -----------------------------------------------------------------------------
create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  customer_id           uuid not null references public.profiles (id),
  vendor_id             uuid references public.vendors (id),   -- null while broadcasting
  category_id           uuid not null references public.categories (id),
  service_id            uuid references public.services (id),  -- null for broadcast requests
  match_type            public.match_type not null,
  mode                  public.service_mode not null,
  status                public.booking_status not null,
  scheduled_at          timestamptz not null,
  duration_min          int not null,
  address               jsonb,                                 -- snapshot of the address for home bookings
  lat                   double precision,
  lng                   double precision,
  notes                 text,
  subtotal              int not null default 0,
  addons_total          int not null default 0,
  travel_fee            int not null default 0,
  platform_fee          int not null default 0,
  total                 int not null default 0,
  payment_method        public.payment_method not null,
  payment_status        public.payment_status not null default 'unpaid',
  broadcast_expires_at  timestamptz,
  cancelled_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index bookings_customer_idx on public.bookings (customer_id, scheduled_at desc);
create index bookings_vendor_idx on public.bookings (vendor_id, scheduled_at);
create index bookings_broadcast_idx on public.bookings (broadcast_expires_at) where status = 'broadcasting';
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_items (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  service_id  uuid references public.services (id),
  addon_id    uuid references public.service_addons (id),
  name        text not null,
  unit_price  int not null,
  quantity    int not null default 1
);

-- Fan-out rows for broadcast matching: one per vendor that was offered the job.
create table public.booking_offers (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings (id) on delete cascade,
  vendor_id     uuid not null references public.vendors (id) on delete cascade,
  distance_km   numeric(6,2),
  status        public.offer_status not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  unique (booking_id, vendor_id)
);
create index booking_offers_vendor_idx on public.booking_offers (vendor_id, status);

-- Status timeline shown on the tracking screen.
create table public.booking_events (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  status      public.booking_status not null,
  actor_id    uuid references public.profiles (id),
  note        text,
  created_at  timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

create or replace function public.log_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.booking_events (booking_id, status, actor_id) values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger bookings_log_status after insert or update of status on public.bookings
  for each row execute function public.log_booking_status();

-- Live location of the vendor while travelling to a home booking.
create table public.vendor_locations (
  booking_id  uuid primary key references public.bookings (id) on delete cascade,
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  heading     double precision,
  updated_at  timestamptz not null default now()
);

-- Chat between customer and vendor, scoped to a booking.
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id),
  body        text,
  image_path  text,
  created_at  timestamptz not null default now(),
  check (body is not null or image_path is not null)
);
create index messages_booking_idx on public.messages (booking_id, created_at);

create or replace function public.is_booking_party(p_booking_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bookings b
    left join public.vendors v on v.id = b.vendor_id
    where b.id = p_booking_id and (b.customer_id = auth.uid() or v.owner_id = auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- Payments, reviews, payouts, push tokens
-- -----------------------------------------------------------------------------
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references public.bookings (id) on delete cascade,
  razorpay_order_id    text unique,
  razorpay_payment_id  text unique,
  amount               int not null,  -- INR (not paise)
  currency             text not null default 'INR',
  status               public.payment_status not null default 'pending',
  method               text,          -- upi | card | netbanking | wallet (from Razorpay)
  raw                  jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references public.bookings (id) on delete cascade,
  customer_id  uuid not null references public.profiles (id),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  reviewer_name text,               -- snapshot (profiles are private), filled by trigger
  comment      text,
  photo_urls   text[] not null default '{}',
  created_at   timestamptz not null default now()
);
create index reviews_vendor_idx on public.reviews (vendor_id, created_at desc);

create or replace function public.refresh_vendor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  perform set_config('app.trusted', 'on', true);
  update public.vendors set
    rating_avg   = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where vendor_id = v), 0),
    rating_count = (select count(*) from public.reviews where vendor_id = v)
  where id = v;
  perform set_config('app.trusted', 'off', true);
  return null;
end $$;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_vendor_rating();

create or replace function public.set_reviewer_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(split_part(full_name, ' ', 1), 'Customer') into new.reviewer_name
  from public.profiles where id = new.customer_id;
  return new;
end $$;
create trigger reviews_set_reviewer_name before insert on public.reviews
  for each row execute function public.set_reviewer_name();

create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors (id) on delete cascade,
  amount        int not null,
  period_start  date not null,
  period_end    date not null,
  status        public.payout_status not null default 'scheduled',
  reference     text,
  created_at    timestamptz not null default now()
);

create table public.push_tokens (
  token       text primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  platform    text not null,
  updated_at  timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

-- -----------------------------------------------------------------------------
-- Read model used by list screens (Home top vendors, search results)
-- -----------------------------------------------------------------------------
create or replace view public.vendor_cards
with (security_invoker = true) as
select
  v.id, v.business_name, v.slug, v.avatar_url, v.cover_url, v.city, v.area,
  v.lat, v.lng, v.offers_home, v.offers_salon, v.is_verified, v.status,
  v.rating_avg, v.rating_count, v.completed_count, v.starting_price, v.years_experience,
  coalesce(array_agg(c.slug order by c.sort_order) filter (where c.slug is not null), '{}') as category_slugs,
  coalesce(array_agg(c.name order by c.sort_order) filter (where c.name is not null), '{}') as category_names
from public.vendors v
left join public.vendor_categories vc on vc.vendor_id = v.id
left join public.categories c on c.id = vc.category_id
group by v.id;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.vendors             enable row level security;
alter table public.vendor_categories   enable row level security;
alter table public.services            enable row level security;
alter table public.service_addons      enable row level security;
alter table public.portfolio_items     enable row level security;
alter table public.vendor_kyc          enable row level security;
alter table public.vendor_availability enable row level security;
alter table public.vendor_time_off     enable row level security;
alter table public.addresses           enable row level security;
alter table public.favorites           enable row level security;
alter table public.bookings            enable row level security;
alter table public.booking_items       enable row level security;
alter table public.booking_offers      enable row level security;
alter table public.booking_events      enable row level security;
alter table public.vendor_locations    enable row level security;
alter table public.messages            enable row level security;
alter table public.payments            enable row level security;
alter table public.reviews             enable row level security;
alter table public.payouts             enable row level security;
alter table public.push_tokens         enable row level security;

-- Profiles: you see and edit your own. Booking counterparts get name/avatar via joins on bookings.
create policy "profiles: self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
-- Vendors can see the name/phone of customers who booked them (needed to do the job).
create policy "profiles: vendor reads own customers" on public.profiles for select
  using (exists (select 1 from public.bookings b where b.customer_id = profiles.id and public.owns_vendor(b.vendor_id)));
create policy "profiles: self update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid());  -- role changes are blocked by guard_profile_role()

-- Public catalog (readable by guests too)
create policy "categories: public read" on public.categories for select using (is_active or public.is_admin());

create policy "vendors: public read live" on public.vendors for select
  using (status = 'live' or owner_id = auth.uid() or public.is_admin());
create policy "vendors: owner insert" on public.vendors for insert
  with check (owner_id = auth.uid() and status in ('draft', 'kyc_pending') and not is_verified);
-- Owners can edit their profile; guard_vendor_admin_fields() stops them self-verifying or self-publishing.
create policy "vendors: owner update" on public.vendors for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vendors: admin all" on public.vendors for all using (public.is_admin());

create policy "vendor_categories: public read" on public.vendor_categories for select using (true);
create policy "vendor_categories: owner write" on public.vendor_categories for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id));

create policy "services: public read" on public.services for select using (true);
create policy "services: owner write" on public.services for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id));

create policy "addons: public read" on public.service_addons for select using (true);
create policy "addons: owner write" on public.service_addons for all
  using (public.owns_vendor((select vendor_id from public.services s where s.id = service_id)))
  with check (public.owns_vendor((select vendor_id from public.services s where s.id = service_id)));

create policy "portfolio: public read" on public.portfolio_items for select using (true);
create policy "portfolio: owner write" on public.portfolio_items for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id));

create policy "kyc: owner read"   on public.vendor_kyc for select using (public.owns_vendor(vendor_id) or public.is_admin());
create policy "kyc: owner submit" on public.vendor_kyc for insert with check (public.owns_vendor(vendor_id) and status = 'pending');
create policy "kyc: owner resubmit" on public.vendor_kyc for update
  using (public.owns_vendor(vendor_id) and status <> 'approved') with check (status = 'pending');
create policy "kyc: admin review" on public.vendor_kyc for update using (public.is_admin());

create policy "availability: public read" on public.vendor_availability for select using (true);
create policy "availability: owner write" on public.vendor_availability for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id));
create policy "time_off: public read" on public.vendor_time_off for select using (true);
create policy "time_off: owner write" on public.vendor_time_off for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id));

create policy "addresses: owner" on public.addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "favorites: owner" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bookings are created only through create_booking() and mutated through RPCs,
-- so clients get read access only (plus the vendor-side status updates below).
create policy "bookings: parties read" on public.bookings for select
  using (customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin()
         or exists (select 1 from public.booking_offers o
                    where o.booking_id = bookings.id and public.owns_vendor(o.vendor_id) and o.status = 'pending'));
create policy "booking_items: parties read" on public.booking_items for select
  using (public.is_booking_party(booking_id) or public.is_admin());
create policy "offers: vendor read" on public.booking_offers for select
  using (public.owns_vendor(vendor_id) or public.is_admin());
create policy "events: parties read" on public.booking_events for select
  using (public.is_booking_party(booking_id) or public.is_admin());

create policy "vendor_locations: parties read" on public.vendor_locations for select
  using (public.is_booking_party(booking_id));
create policy "vendor_locations: vendor write" on public.vendor_locations for all
  using (public.owns_vendor(vendor_id)) with check (public.owns_vendor(vendor_id) and public.is_booking_party(booking_id));

create policy "messages: parties read"  on public.messages for select using (public.is_booking_party(booking_id));
create policy "messages: parties write" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_booking_party(booking_id));

-- Payments are written only by Edge Functions using the service role key.
create policy "payments: parties read" on public.payments for select using (public.is_booking_party(booking_id));

create policy "reviews: public read" on public.reviews for select using (true);
create policy "reviews: customer write" on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (select 1 from public.bookings b
                where b.id = booking_id and b.customer_id = auth.uid()
                  and b.status = 'completed' and b.vendor_id = reviews.vendor_id)
  );

create policy "payouts: owner read" on public.payouts for select using (public.owns_vendor(vendor_id) or public.is_admin());

create policy "push_tokens: owner" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Column guards (RLS cannot compare old vs new values, triggers can).
-- auth.uid() is null for the service role (Edge Functions, SQL editor), which may change anything.
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

create or replace function public.guard_vendor_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- app.trusted is set (transaction-local) by internal functions such as refresh_vendor_rating().
  if auth.uid() is null or public.is_admin() or current_setting('app.trusted', true) = 'on' then
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.rating_avg is distinct from old.rating_avg
     or new.rating_count is distinct from old.rating_count
     or new.completed_count is distinct from old.completed_count
     or new.owner_id is distinct from old.owner_id then
    raise exception 'This field is managed by Glam & Glow';
  end if;
  -- Vendors may only move themselves forward through onboarding (draft -> kyc_pending -> under_review).
  if new.status is distinct from old.status
     and not (old.status in ('draft', 'kyc_pending', 'rejected') and new.status in ('kyc_pending', 'under_review')) then
    raise exception 'Vendor status % -> % requires admin review', old.status, new.status;
  end if;
  return new;
end $$;
create trigger vendors_guard_admin_fields before update on public.vendors
  for each row execute function public.guard_vendor_admin_fields();
