-- =============================================================================
-- Glam & Glow — booking, matching, search and admin RPCs; storage; realtime; cron
-- All money is whole INR. All times are timestamptz; slot generation uses Asia/Kolkata.
-- =============================================================================

-- Tunables. Change them here, then re-run this function definition.
create or replace function public.app_config(p_key text)
returns numeric language sql immutable as $$
  select case p_key
    when 'broadcast_window_minutes' then 5      -- how long nearby vendors have to accept
    when 'broadcast_max_vendors'    then 20     -- fan-out cap per request
    when 'salon_search_radius_km'   then 10     -- how far a customer will travel to a salon
    when 'home_travel_fee'          then 99     -- INR added to at-home bookings
    when 'platform_fee_pct'         then 2      -- % of service value kept by the platform
    when 'min_lead_minutes'         then 60     -- earliest bookable time from now
  end;
$$;

-- -----------------------------------------------------------------------------
-- Availability
-- -----------------------------------------------------------------------------
create or replace function public.vendor_is_free(p_vendor_id uuid, p_start timestamptz, p_duration_min int)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
      select 1 from public.bookings b
      where b.vendor_id = p_vendor_id
        and b.status in ('requested', 'accepted', 'en_route', 'in_progress')
        and tstzrange(b.scheduled_at, b.scheduled_at + make_interval(mins => b.duration_min))
            && tstzrange(p_start, p_start + make_interval(mins => p_duration_min))
    )
    and not exists (
      select 1 from public.vendor_time_off t
      where t.vendor_id = p_vendor_id
        and tstzrange(t.starts_at, t.ends_at) && tstzrange(p_start, p_start + make_interval(mins => p_duration_min))
    );
$$;

-- 30-minute start slots for a vendor on a given local date. Vendors who haven't
-- configured weekly hours default to 09:00–20:00.
create or replace function public.get_available_slots(p_vendor_id uuid, p_date date, p_duration_min int)
returns table (slot_start timestamptz)
language sql stable security definer set search_path = public as $$
  with windows as (
    select (p_date + a.start_time) at time zone 'Asia/Kolkata' as ws,
           (p_date + a.end_time)   at time zone 'Asia/Kolkata' as we
    from public.vendor_availability a
    where a.vendor_id = p_vendor_id and a.weekday = extract(dow from p_date)
    union all
    select (p_date + time '09:00') at time zone 'Asia/Kolkata',
           (p_date + time '20:00') at time zone 'Asia/Kolkata'
    where not exists (select 1 from public.vendor_availability where vendor_id = p_vendor_id)
  ),
  slots as (
    select generate_series(ws, we - make_interval(mins => p_duration_min), interval '30 minutes') as s
    from windows
  )
  select s from slots
  where s > now() + make_interval(mins => public.app_config('min_lead_minutes')::int)
    and public.vendor_is_free(p_vendor_id, s, p_duration_min)
  order by s;
$$;

-- -----------------------------------------------------------------------------
-- Pricing — single source of truth for the order review screen and create_booking
-- -----------------------------------------------------------------------------
create or replace function public.quote_booking(
  p_service_id uuid,
  p_mode public.service_mode,
  p_addon_ids uuid[] default '{}'
)
returns table (subtotal int, addons_total int, travel_fee int, platform_fee int, total int, duration_min int)
language plpgsql stable set search_path = public as $$
declare
  s public.services;
  v_sub int;
  v_addons int;
  v_addon_minutes int;
  v_travel int;
  v_fee int;
begin
  select * into s from public.services where id = p_service_id and is_active;
  if not found then raise exception 'Service not found'; end if;

  v_sub := case p_mode when 'home' then s.price_home else s.price_salon end;
  if v_sub is null then raise exception 'This service is not offered %', case p_mode when 'home' then 'at home' else 'at the salon' end; end if;

  select coalesce(sum(a.price), 0), coalesce(sum(a.duration_min), 0)
    into v_addons, v_addon_minutes
  from public.service_addons a
  where a.service_id = p_service_id and a.id = any (coalesce(p_addon_ids, '{}'));

  v_travel := case p_mode when 'home' then public.app_config('home_travel_fee')::int else 0 end;
  v_fee := round((v_sub + v_addons) * public.app_config('platform_fee_pct') / 100.0)::int;

  return query select v_sub, v_addons, v_travel, v_fee, v_sub + v_addons + v_travel + v_fee, s.duration_min + v_addon_minutes;
end $$;

-- -----------------------------------------------------------------------------
-- create_booking — handles both direct and broadcast matching
-- -----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_match_type      public.match_type,
  p_mode            public.service_mode,
  p_category_id     uuid,
  p_scheduled_at    timestamptz,
  p_payment_method  public.payment_method,
  p_vendor_id       uuid default null,     -- direct only
  p_service_id      uuid default null,     -- direct only
  p_addon_ids       uuid[] default '{}',   -- direct only
  p_budget          int default null,      -- broadcast only: what the customer will pay
  p_duration_min    int default 90,        -- broadcast only
  p_address_id      uuid default null,     -- required for home bookings
  p_lat             double precision default null, -- broadcast salon: where the customer is
  p_lng             double precision default null,
  p_notes           text default null
)
returns public.bookings
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid uuid := auth.uid();
  v_addr public.addresses;
  v_vendor public.vendors;
  v_q record;
  v_booking public.bookings;
  v_lat double precision := p_lat;
  v_lng double precision := p_lng;
  v_offers int;
begin
  if v_uid is null then raise exception 'Please sign in to book'; end if;
  if p_scheduled_at < now() + make_interval(mins => public.app_config('min_lead_minutes')::int) then
    raise exception 'Please choose a time at least % minutes from now', public.app_config('min_lead_minutes');
  end if;

  if p_mode = 'home' then
    select * into v_addr from public.addresses where id = p_address_id and user_id = v_uid;
    if not found then raise exception 'Please choose an address for an at-home booking'; end if;
    v_lat := v_addr.lat;
    v_lng := v_addr.lng;
  end if;

  -- ---------------- Direct booking ----------------
  if p_match_type = 'direct' then
    select * into v_vendor from public.vendors where id = p_vendor_id and status = 'live';
    if not found then raise exception 'This artist is not taking bookings right now'; end if;
    if (p_mode = 'home' and not v_vendor.offers_home) or (p_mode = 'salon' and not v_vendor.offers_salon) then
      raise exception 'This artist does not offer % appointments', p_mode;
    end if;
    if not exists (select 1 from public.services where id = p_service_id and vendor_id = p_vendor_id) then
      raise exception 'Service does not belong to this artist';
    end if;
    if p_mode = 'salon' then
      v_lat := v_vendor.lat;
      v_lng := v_vendor.lng;
    elsif v_vendor.location is not null and
          st_distance(v_vendor.location, st_setsrid(st_makepoint(v_lng, v_lat), 4326)::geography) / 1000 > v_vendor.service_radius_km then
      raise exception 'This address is outside the artist''s service area';
    end if;

    select * into v_q from public.quote_booking(p_service_id, p_mode, p_addon_ids);
    if not public.vendor_is_free(p_vendor_id, p_scheduled_at, v_q.duration_min) then
      raise exception 'That time is no longer available. Please pick another slot.';
    end if;

    insert into public.bookings (
      customer_id, vendor_id, category_id, service_id, match_type, mode, status, scheduled_at,
      duration_min, address, lat, lng, notes, subtotal, addons_total, travel_fee, platform_fee, total, payment_method
    ) values (
      v_uid, p_vendor_id, (select category_id from public.services where id = p_service_id), p_service_id, 'direct', p_mode, 'requested', p_scheduled_at,
      v_q.duration_min, case when p_mode = 'home' then to_jsonb(v_addr) end, v_lat, v_lng, p_notes,
      v_q.subtotal, v_q.addons_total, v_q.travel_fee, v_q.platform_fee, v_q.total, p_payment_method
    ) returning * into v_booking;

    insert into public.booking_items (booking_id, service_id, name, unit_price)
      select v_booking.id, s.id, s.name, v_q.subtotal from public.services s where s.id = p_service_id;
    insert into public.booking_items (booking_id, service_id, addon_id, name, unit_price)
      select v_booking.id, a.service_id, a.id, a.name, a.price
      from public.service_addons a where a.service_id = p_service_id and a.id = any (coalesce(p_addon_ids, '{}'));

    return v_booking;
  end if;

  -- ---------------- Broadcast booking ----------------
  if p_budget is null or p_budget <= 0 then raise exception 'Please enter your budget'; end if;
  if v_lat is null or v_lng is null then raise exception 'We need your location to find nearby artists'; end if;

  insert into public.bookings (
    customer_id, category_id, match_type, mode, status, scheduled_at, duration_min, address, lat, lng, notes,
    subtotal, travel_fee, platform_fee, total, payment_method, broadcast_expires_at
  ) values (
    v_uid, p_category_id, 'broadcast', p_mode, 'broadcasting', p_scheduled_at, p_duration_min,
    case when p_mode = 'home' then to_jsonb(v_addr) end, v_lat, v_lng, p_notes,
    p_budget,
    case p_mode when 'home' then public.app_config('home_travel_fee')::int else 0 end,
    round(p_budget * public.app_config('platform_fee_pct') / 100.0)::int,
    p_budget + case p_mode when 'home' then public.app_config('home_travel_fee')::int else 0 end
             + round(p_budget * public.app_config('platform_fee_pct') / 100.0)::int,
    p_payment_method,
    now() + make_interval(mins => public.app_config('broadcast_window_minutes')::int)
  ) returning * into v_booking;

  -- Fan out to nearby, verified, live vendors in this category who offer this mode and are free.
  with candidates as (
    select v.id,
           st_distance(v.location, st_setsrid(st_makepoint(v_lng, v_lat), 4326)::geography) / 1000 as km,
           v.service_radius_km
    from public.vendors v
    join public.vendor_categories vc on vc.vendor_id = v.id and vc.category_id = p_category_id
    where v.status = 'live' and v.is_verified and v.location is not null
      and (case p_mode when 'home' then v.offers_home else v.offers_salon end)
      and v.owner_id is distinct from v_uid
  )
  insert into public.booking_offers (booking_id, vendor_id, distance_km)
  select v_booking.id, c.id, round(c.km::numeric, 2)
  from candidates c
  where c.km <= case p_mode when 'home' then c.service_radius_km else public.app_config('salon_search_radius_km') end
    and public.vendor_is_free(c.id, p_scheduled_at, p_duration_min)
  order by c.km
  limit public.app_config('broadcast_max_vendors')::int;

  get diagnostics v_offers = row_count;
  if v_offers = 0 then
    raise exception 'No verified artists are available near you at that time. Try another time or browse artists directly.';
  end if;

  return v_booking;
end $$;

-- -----------------------------------------------------------------------------
-- Broadcast: first vendor to accept wins (row lock on the booking guarantees it)
-- -----------------------------------------------------------------------------
create or replace function public.respond_to_offer(p_offer_id uuid, p_accept boolean)
returns boolean   -- true = you got the job (or declined successfully); false = too late
language plpgsql security definer set search_path = public as $$
declare
  v_offer public.booking_offers;
  v_won uuid;
begin
  select * into v_offer from public.booking_offers where id = p_offer_id for update;
  if not found or not public.owns_vendor(v_offer.vendor_id) then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'pending' then return false; end if;

  if not p_accept then
    update public.booking_offers set status = 'declined', responded_at = now() where id = p_offer_id;
    -- If every vendor has declined, end the broadcast early.
    update public.bookings set status = 'expired'
     where id = v_offer.booking_id and status = 'broadcasting'
       and not exists (select 1 from public.booking_offers where booking_id = v_offer.booking_id and status = 'pending');
    return true;
  end if;

  -- Concurrent accepts serialise on this row; the loser re-checks the WHERE clause and updates nothing.
  update public.bookings
     set vendor_id = v_offer.vendor_id, status = 'accepted'
   where id = v_offer.booking_id and status = 'broadcasting' and broadcast_expires_at > now()
  returning id into v_won;

  if v_won is null then
    update public.booking_offers set status = 'lost', responded_at = now() where id = p_offer_id;
    return false;
  end if;

  update public.booking_offers set status = 'accepted', responded_at = now() where id = p_offer_id;
  update public.booking_offers set status = 'lost' where booking_id = v_offer.booking_id and id <> p_offer_id and status = 'pending';
  return true;
end $$;

-- Direct booking: the chosen vendor accepts or declines.
create or replace function public.respond_to_booking(p_booking_id uuid, p_accept boolean)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare v_booking public.bookings;
begin
  update public.bookings
     set status = case when p_accept then 'accepted'::public.booking_status else 'declined'::public.booking_status end
   where id = p_booking_id and status = 'requested' and public.owns_vendor(vendor_id)
  returning * into v_booking;
  if v_booking.id is null then raise exception 'This request is no longer pending'; end if;
  return v_booking;
end $$;

-- Vendor progresses a booking: accepted → en_route → in_progress → completed.
create or replace function public.advance_booking(p_booking_id uuid, p_status public.booking_status)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings;
  v_allowed boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or not public.owns_vendor(v_booking.vendor_id) then raise exception 'Booking not found'; end if;

  v_allowed :=
       (v_booking.status = 'accepted'    and p_status = 'en_route')
    or (v_booking.status = 'accepted'    and p_status = 'in_progress')  -- salon bookings skip en_route
    or (v_booking.status = 'en_route'    and p_status = 'in_progress')
    or (v_booking.status = 'in_progress' and p_status = 'completed');
  if not v_allowed then raise exception 'Cannot move booking from % to %', v_booking.status, p_status; end if;

  update public.bookings set
    status = p_status,
    payment_status = case when p_status = 'completed' and payment_method = 'pay_at_service' then 'paid' else payment_status end
  where id = p_booking_id returning * into v_booking;

  if p_status = 'completed' then
    perform set_config('app.trusted', 'on', true);
    update public.vendors set completed_count = completed_count + 1 where id = v_booking.vendor_id;
    perform set_config('app.trusted', 'off', true);
    delete from public.vendor_locations where booking_id = p_booking_id;
  end if;
  return v_booking;
end $$;

create or replace function public.cancel_booking(p_booking_id uuid, p_reason text default null)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare v_booking public.bookings;
begin
  update public.bookings set status = 'cancelled', cancelled_reason = p_reason
   where id = p_booking_id
     and (customer_id = auth.uid() or public.owns_vendor(vendor_id))
     and status in ('requested', 'broadcasting', 'accepted')
  returning * into v_booking;
  if v_booking.id is null then raise exception 'This booking can no longer be cancelled'; end if;
  update public.booking_offers set status = 'expired' where booking_id = p_booking_id and status = 'pending';
  return v_booking;
end $$;

-- Runs every minute via pg_cron (below). Safe to call manually.
create or replace function public.expire_stale_bookings()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.booking_offers o set status = 'expired'
    from public.bookings b
   where o.booking_id = b.id and o.status = 'pending'
     and b.status = 'broadcasting' and b.broadcast_expires_at <= now();
  update public.bookings set status = 'expired'
   where status = 'broadcasting' and broadcast_expires_at <= now();
  -- Direct requests the vendor never answered before the appointment time.
  update public.bookings set status = 'expired'
   where status = 'requested' and scheduled_at <= now();
end $$;

-- -----------------------------------------------------------------------------
-- Search
-- -----------------------------------------------------------------------------
create or replace function public.search_vendors(
  p_category_slug text default null,
  p_query         text default null,
  p_mode          public.service_mode default null,
  p_min_price     int default null,
  p_max_price     int default null,
  p_lat           double precision default null,
  p_lng           double precision default null,
  p_radius_km     int default null,
  p_verified_only boolean default false,
  p_sort          text default 'rating',   -- rating | price_low | price_high | distance
  p_limit         int default 20,
  p_offset        int default 0
)
returns table (
  id uuid, business_name text, slug text, avatar_url text, cover_url text, city text, area text,
  offers_home boolean, offers_salon boolean, is_verified boolean,
  rating_avg numeric, rating_count int, completed_count int, starting_price int, years_experience int,
  category_slugs text[], category_names text[], distance_km double precision
)
language sql stable set search_path = public, extensions as $$
  select
    vc.id, vc.business_name, vc.slug, vc.avatar_url, vc.cover_url, vc.city, vc.area,
    vc.offers_home, vc.offers_salon, vc.is_verified,
    vc.rating_avg, vc.rating_count, vc.completed_count, vc.starting_price, vc.years_experience,
    vc.category_slugs, vc.category_names,
    case when p_lat is null or p_lng is null or vc.lat is null then null
         else st_distance(
                st_setsrid(st_makepoint(vc.lng, vc.lat), 4326)::geography,
                st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000 end as distance_km
  from public.vendor_cards vc
  where vc.status = 'live'
    and (p_category_slug is null or p_category_slug = any (vc.category_slugs))
    and (p_query is null or p_query = ''
         or vc.business_name ilike '%' || p_query || '%'
         or vc.area ilike '%' || p_query || '%'
         or exists (select 1 from public.services s
                    where s.vendor_id = vc.id and s.is_active and s.name ilike '%' || p_query || '%'))
    and (p_mode is null or (p_mode = 'home' and vc.offers_home) or (p_mode = 'salon' and vc.offers_salon))
    and (p_min_price is null or vc.starting_price >= p_min_price)
    and (p_max_price is null or vc.starting_price <= p_max_price)
    and (not p_verified_only or vc.is_verified)
    and (p_radius_km is null or p_lat is null or p_lng is null or vc.lat is null
         or st_dwithin(st_setsrid(st_makepoint(vc.lng, vc.lat), 4326)::geography,
                       st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
                       p_radius_km * 1000))
  order by
    case when p_sort = 'price_low'  then vc.starting_price end asc nulls last,
    case when p_sort = 'price_high' then vc.starting_price end desc nulls last,
    case when p_sort = 'distance' and p_lat is not null and vc.lat is not null then
      st_distance(st_setsrid(st_makepoint(vc.lng, vc.lat), 4326)::geography,
                  st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) end asc nulls last,
    vc.is_verified desc, vc.rating_avg desc, vc.rating_count desc
  limit least(p_limit, 50) offset p_offset;
$$;

-- -----------------------------------------------------------------------------
-- Vendor dashboard
-- -----------------------------------------------------------------------------
create or replace function public.vendor_earnings_summary()
returns table (today_bookings int, today_earnings int, week_earnings int, month_earnings int, pending_payout int)
language sql stable security definer set search_path = public as $$
  with mine as (
    select b.*, (b.subtotal + b.addons_total + b.travel_fee) as vendor_share
    from public.bookings b where b.vendor_id = public.my_vendor_id()
  ),
  bounds as (
    select (date_trunc('day', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata' as day_start,
           (date_trunc('week', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata' as week_start,
           (date_trunc('month', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata' as month_start
  )
  select
    (select count(*) from mine, bounds where scheduled_at >= day_start and scheduled_at < day_start + interval '1 day'
       and status in ('accepted', 'en_route', 'in_progress', 'completed'))::int,
    (select coalesce(sum(vendor_share), 0) from mine, bounds where status = 'completed' and scheduled_at >= day_start)::int,
    (select coalesce(sum(vendor_share), 0) from mine, bounds where status = 'completed' and scheduled_at >= week_start)::int,
    (select coalesce(sum(vendor_share), 0) from mine, bounds where status = 'completed' and scheduled_at >= month_start)::int,
    ((select coalesce(sum(vendor_share), 0) from mine where status = 'completed')
      - (select coalesce(sum(amount), 0) from public.payouts where vendor_id = public.my_vendor_id() and status <> 'failed'))::int;
$$;

-- -----------------------------------------------------------------------------
-- Admin: approve or reject a vendor after KYC review
-- -----------------------------------------------------------------------------
create or replace function public.admin_review_vendor(p_vendor_id uuid, p_approve boolean, p_notes text default null)
returns public.vendors
language plpgsql security definer set search_path = public as $$
declare v_vendor public.vendors;
begin
  if not public.is_admin() and auth.uid() is not null then raise exception 'Admins only'; end if;

  update public.vendor_kyc set
    status = case when p_approve then 'approved'::public.kyc_status else 'rejected'::public.kyc_status end,
    reviewer_notes = p_notes, reviewed_by = auth.uid(), reviewed_at = now()
  where vendor_id = p_vendor_id;

  update public.vendors set
    status = case when p_approve then 'live'::public.vendor_status else 'rejected'::public.vendor_status end,
    is_verified = p_approve
  where id = p_vendor_id returning * into v_vendor;

  if p_approve and v_vendor.owner_id is not null then
    update public.profiles set role = 'vendor' where id = v_vendor.owner_id and role = 'customer';
  end if;
  return v_vendor;
end $$;

-- Lock down: these run with definer rights, so only expose what the app calls.
revoke execute on function public.expire_stale_bookings() from public, anon, authenticated;
revoke execute on function public.admin_review_vendor(uuid, boolean, text) from public, anon;

-- =============================================================================
-- Storage buckets (public = readable by URL without a token)
-- Upload paths must start with the uploader's user id: `<uid>/<file>`.
-- Chat uploads start with the booking id: `<booking_id>/<file>`.
-- =============================================================================
insert into storage.buckets (id, name, public) values
  ('avatars',   'avatars',   true),
  ('portfolio', 'portfolio', true),
  ('reviews',   'reviews',   true),
  ('kyc',       'kyc',       false),
  ('chat',      'chat',      false)
on conflict (id) do nothing;

create policy "public buckets: read" on storage.objects for select
  using (bucket_id in ('avatars', 'portfolio', 'reviews'));
create policy "own folder: upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'portfolio', 'reviews', 'kyc')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own folder: update" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'portfolio', 'reviews', 'kyc') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own folder: delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'portfolio', 'reviews', 'kyc') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "chat: booking parties read" on storage.objects for select to authenticated
  using (bucket_id = 'chat' and public.is_booking_party(((storage.foldername(name))[1])::uuid));
create policy "chat: booking parties upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and public.is_booking_party(((storage.foldername(name))[1])::uuid));

-- =============================================================================
-- Realtime: stream these tables to subscribed clients (RLS still applies)
-- =============================================================================
alter publication supabase_realtime add table
  public.bookings, public.booking_offers, public.booking_events, public.vendor_locations, public.messages;

-- =============================================================================
-- Scheduled job: expire broadcasts every minute (pg_cron is available on the free plan)
-- =============================================================================
create extension if not exists pg_cron;
select cron.schedule('expire-stale-bookings', '* * * * *', $$select public.expire_stale_bookings();$$);
