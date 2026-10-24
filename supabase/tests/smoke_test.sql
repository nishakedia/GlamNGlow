-- =============================================================================
-- Glam & Glow — backend smoke test
--
-- Paste into Supabase → SQL Editor and run AFTER the migrations + seed.
-- Everything happens inside one transaction that is ROLLED BACK at the end,
-- so it leaves no data behind. Success = the final "ALL SMOKE TESTS PASSED" notice.
--
-- It impersonates users the way PostgREST does (role + JWT claims), so RLS,
-- column guards, pricing, direct booking and first-to-accept broadcast matching
-- are all exercised for real.
-- =============================================================================
begin;

-- ---------------------------------------------------------------- test users
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'customer@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'artist1@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'artist2@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'artist3@test.local');

do $$ begin
  assert (select count(*) from public.profiles where id::text like 'aaaaaaaa-%') = 4, 'profile trigger did not create profiles';
end $$;

-- ---------------------------------------------------------------- guest browsing
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$ begin
  assert (select count(*) from public.categories) >= 6, 'guests should see categories';
  assert (select count(*) from public.vendor_cards where status = 'live') >= 6, 'guests should see live vendors';
  assert (select count(*) from public.search_vendors(p_category_slug => 'mehndi')) >= 1, 'search by category failed';
  assert (select count(*) from public.search_vendors(p_query => 'bridal')) >= 1, 'text search failed';
  assert (select count(*) from public.search_vendors(p_mode => 'salon', p_max_price => 2000)) >= 1, 'mode+price filter failed';
  assert (select distance_km from public.search_vendors(p_lat => 19.07, p_lng => 72.88, p_sort => 'distance') limit 1) is not null,
    'distance sort should return distances';
end $$;
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser

-- ---------------------------------------------------------------- artists onboard
-- Artist 1 and 2 create profiles near Kurla, Mumbai; artist 3 stays in draft.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.vendors (id, owner_id, business_name, city, lat, lng, offers_home, service_radius_km)
  values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Test Artist One', 'Mumbai', 19.072, 72.882, true, 25);
insert into public.vendor_categories values ('bbbbbbbb-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
do $$
declare blocked boolean := false;
begin
  begin
    update public.vendors set is_verified = true where id = 'bbbbbbbb-0000-0000-0000-000000000001';
  exception when others then blocked := true;
  end;
  assert blocked, 'vendors must not be able to self-verify';
end $$;

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}', true);
insert into public.vendors (id, owner_id, business_name, city, lat, lng, offers_home, service_radius_km)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 'Test Artist Two', 'Mumbai', 19.075, 72.879, true, 25);
insert into public.vendor_categories values ('bbbbbbbb-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000004","role":"authenticated"}', true);
insert into public.vendors (id, owner_id, business_name, city)
  values ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000004', 'Draft Artist', 'Mumbai');
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser

-- Admin approves artists 1 and 2 (SQL editor runs as postgres, which the RPC allows).
select public.admin_review_vendor('bbbbbbbb-0000-0000-0000-000000000001', true, 'ok');
select public.admin_review_vendor('bbbbbbbb-0000-0000-0000-000000000002', true, 'ok');

set local role anon;
select set_config('request.jwt.claims', '', true);
do $$ begin
  assert not exists (select 1 from public.vendor_cards where id = 'bbbbbbbb-0000-0000-0000-000000000003'),
    'draft vendors must be hidden from guests';
  assert exists (select 1 from public.vendor_cards where id = 'bbbbbbbb-0000-0000-0000-000000000001' and is_verified),
    'approved vendor should be live and verified';
end $$;
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser

-- ---------------------------------------------------------------- customer: direct booking
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
update public.profiles set full_name = 'Priya Sharma' where id = auth.uid();
do $$
declare blocked boolean := false;
begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
  exception when others then blocked := true;
  end;
  assert blocked, 'customers must not be able to change their role';
end $$;

insert into public.addresses (id, user_id, label, line1, city, lat, lng, is_default)
  values ('cccccccc-0000-0000-0000-000000000001', auth.uid(), 'Home', '12 LBS Marg, Kurla West', 'Mumbai', 19.07, 72.88, true);

do $$
declare q record;
begin
  select * into q from public.quote_booking('30000000-0000-0000-0000-000000000001', 'home',
    array(select id from public.service_addons where service_id = '30000000-0000-0000-0000-000000000001' and name = 'Mink lashes'));
  assert q.subtotal = 4500 and q.addons_total = 800, format('quote subtotal/addons wrong: %s', q);
  assert q.travel_fee = 99 and q.platform_fee = 106 and q.total = 5505, format('quote fees wrong: %s', q);
end $$;

-- Book the first free slot tomorrow with Aanya (seed vendor, owner-less).
select set_config('test.slot', (
  select min(slot_start)::text from public.get_available_slots(
    '20000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 1, 90)), true);
select set_config('test.direct', (
  select id::text from public.create_booking(
    p_match_type => 'direct', p_mode => 'home', p_category_id => '10000000-0000-0000-0000-000000000001',
    p_scheduled_at => current_setting('test.slot')::timestamptz, p_payment_method => 'pay_at_service',
    p_vendor_id => '20000000-0000-0000-0000-000000000001', p_service_id => '30000000-0000-0000-0000-000000000001',
    p_address_id => 'cccccccc-0000-0000-0000-000000000001')), true);

do $$
declare b public.bookings; blocked boolean := false; n int;
begin
  select * into b from public.bookings where id = current_setting('test.direct')::uuid;
  assert b.status = 'requested' and b.total = 4500 + 99 + 90, format('direct booking wrong: %s %s', b.status, b.total);
  assert (select count(*) from public.booking_events where booking_id = b.id) = 1, 'status event not logged';
  -- Same slot again must be rejected (vendor is no longer free).
  begin
    perform public.create_booking(
      p_match_type => 'direct', p_mode => 'home', p_category_id => b.category_id,
      p_scheduled_at => b.scheduled_at, p_payment_method => 'pay_at_service',
      p_vendor_id => b.vendor_id, p_service_id => b.service_id, p_address_id => 'cccccccc-0000-0000-0000-000000000001');
  exception when others then blocked := true;
  end;
  assert blocked, 'double-booking the same slot must fail';
  -- Customers cannot edit bookings directly (only via RPCs).
  update public.bookings set status = 'completed' where id = b.id;
  get diagnostics n = row_count;
  assert n = 0, 'customers must not update bookings directly';
end $$;

-- ---------------------------------------------------------------- customer: broadcast booking
select set_config('test.broadcast', (
  select id::text from public.create_booking(
    p_match_type => 'broadcast', p_mode => 'home', p_category_id => '10000000-0000-0000-0000-000000000001',
    p_scheduled_at => (current_setting('test.slot')::timestamptz + interval '3 hours'), p_payment_method => 'online',
    p_budget => 5000, p_duration_min => 90, p_address_id => 'cccccccc-0000-0000-0000-000000000001')), true);
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser

do $$ begin
  assert (select count(*) from public.booking_offers where booking_id = current_setting('test.broadcast')::uuid
          and vendor_id in ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002')) = 2,
    'both nearby verified test artists should receive the broadcast';
  assert not exists (select 1 from public.booking_offers where booking_id = current_setting('test.broadcast')::uuid
          and vendor_id = '20000000-0000-0000-0000-000000000003'), 'nail studio must not get a makeup request';
end $$;

-- ---------------------------------------------------------------- artists race to accept
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
declare won boolean;
begin
  assert exists (select 1 from public.bookings where id = current_setting('test.broadcast')::uuid),
    'invited artist should be able to read the broadcast booking';
  assert not exists (select 1 from public.bookings where id = current_setting('test.direct')::uuid),
    'artists must not see other artists'' bookings';
  select public.respond_to_offer(o.id, true) into won
    from public.booking_offers o where o.booking_id = current_setting('test.broadcast')::uuid and o.vendor_id = public.my_vendor_id();
  assert won, 'first artist to accept should win';
end $$;

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
declare won boolean;
begin
  select public.respond_to_offer(o.id, true) into won
    from public.booking_offers o where o.booking_id = current_setting('test.broadcast')::uuid and o.vendor_id = public.my_vendor_id();
  assert won is false, 'second artist must lose the race';
end $$;

-- ---------------------------------------------------------------- winner does the job
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = current_setting('test.broadcast')::uuid;
  assert b.status = 'accepted' and b.vendor_id = 'bbbbbbbb-0000-0000-0000-000000000001', 'broadcast not assigned to winner';
  assert (select full_name from public.profiles where id = b.customer_id) = 'Priya Sharma', 'artist should see their customer''s name';
  perform public.advance_booking(b.id, 'en_route');
  insert into public.vendor_locations (booking_id, vendor_id, lat, lng) values (b.id, b.vendor_id, 19.071, 72.881);
  perform public.advance_booking(b.id, 'in_progress');
  perform public.advance_booking(b.id, 'completed');
  assert (select completed_count from public.vendors where id = b.vendor_id) = 1, 'completed_count not incremented';
  assert (select pending_payout from public.vendor_earnings_summary()) = 5000 + 99, 'earnings summary wrong';
end $$;

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$ begin
  assert not exists (select 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
    'losing artist must not see the customer profile';
end $$;

-- ---------------------------------------------------------------- customer reviews
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.reviews (booking_id, customer_id, vendor_id, rating, comment)
  values (current_setting('test.broadcast')::uuid, auth.uid(), 'bbbbbbbb-0000-0000-0000-000000000001', 5, 'Loved it');
do $$
declare blocked boolean := false;
begin
  assert (select rating_avg = 5 and rating_count = 1 from public.vendors where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
    'rating trigger did not update the vendor';
  assert (select reviewer_name from public.reviews where booking_id = current_setting('test.broadcast')::uuid) = 'Priya',
    'reviewer name snapshot missing';
  begin  -- the direct booking is not completed, so it cannot be reviewed
    insert into public.reviews (booking_id, customer_id, vendor_id, rating)
      values (current_setting('test.direct')::uuid, auth.uid(), '20000000-0000-0000-0000-000000000001', 1);
  exception when others then blocked := true;
  end;
  assert blocked, 'reviews require a completed booking';
end $$;
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser

-- ---------------------------------------------------------------- broadcast expiry
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
select set_config('test.expiring', (
  select id::text from public.create_booking(
    p_match_type => 'broadcast', p_mode => 'home', p_category_id => '10000000-0000-0000-0000-000000000001',
    p_scheduled_at => (current_setting('test.slot')::timestamptz + interval '6 hours'), p_payment_method => 'online',
    p_budget => 3000, p_address_id => 'cccccccc-0000-0000-0000-000000000001')), true);
reset role;
select set_config('request.jwt.claims', '', true);  -- back to the SQL-editor superuser
update public.bookings set broadcast_expires_at = now() - interval '1 second' where id = current_setting('test.expiring')::uuid;
select public.expire_stale_bookings();
do $$ begin
  assert (select status from public.bookings where id = current_setting('test.expiring')::uuid) = 'expired', 'broadcast did not expire';
  assert not exists (select 1 from public.booking_offers where booking_id = current_setting('test.expiring')::uuid and status = 'pending'),
    'pending offers should expire with the broadcast';
  raise notice 'ALL SMOKE TESTS PASSED';
end $$;

rollback;
