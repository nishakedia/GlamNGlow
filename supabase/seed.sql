-- =============================================================================
-- Demo data so the Home screen has something to show on a fresh project.
-- Safe to re-run: everything uses fixed ids + ON CONFLICT.
-- Demo vendors have no owner (owner_id = null); real vendors sign up in the app.
-- Images use picsum.photos placeholders — replace with real portfolio photos.
-- =============================================================================

insert into public.categories (id, slug, name, tagline, icon, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'makeup',  'Makeup',      'Party, editorial & everyday', 'color-palette-outline', 1),
  ('10000000-0000-0000-0000-000000000002', 'mehndi',  'Mehndi',      'Bridal & festive henna',      'flower-outline',        2),
  ('10000000-0000-0000-0000-000000000003', 'nails',   'Nails',       'Gel, acrylic & nail art',     'hand-left-outline',     3),
  ('10000000-0000-0000-0000-000000000004', 'bridal',  'Bridal',      'Complete wedding-day looks',  'diamond-outline',       4),
  ('10000000-0000-0000-0000-000000000005', 'salon',   'Salon',       'Hair, skin & spa treatments', 'cut-outline',           5),
  ('10000000-0000-0000-0000-000000000006', 'hair',    'Hairstyling', 'Buns, braids & blow-dries',   'sparkles-outline',      6)
on conflict (id) do update set name = excluded.name, tagline = excluded.tagline, icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.vendors (id, business_name, slug, bio, avatar_url, cover_url, city, area, salon_address, lat, lng,
                            offers_home, offers_salon, service_radius_km, years_experience, languages, is_verified, status) values
  ('20000000-0000-0000-0000-000000000001', 'Aanya Kapoor Makeup', 'aanya-kapoor-makeup',
   'HD & airbrush makeup artist specialising in soft-glam bridal looks.',
   'https://picsum.photos/seed/gg-aanya/300/300', 'https://picsum.photos/seed/gg-aanya-cover/900/500',
   'Mumbai', 'Bandra West', null, 19.0596, 72.8295, true, false, 20, 8, '{English,Hindi}', true, 'live'),
  ('20000000-0000-0000-0000-000000000002', 'Henna by Rukhsar', 'henna-by-rukhsar',
   'Intricate Arabic and Rajasthani mehndi. 500+ brides decorated.',
   'https://picsum.photos/seed/gg-rukhsar/300/300', 'https://picsum.photos/seed/gg-rukhsar-cover/900/500',
   'Mumbai', 'Andheri East', 'Shop 4, Marol Naka, Andheri East', 19.1136, 72.8697, true, true, 25, 12, '{Hindi,Urdu,English}', true, 'live'),
  ('20000000-0000-0000-0000-000000000003', 'The Nail Atelier', 'the-nail-atelier',
   'Gel extensions, chrome and hand-painted nail art in a calm studio.',
   'https://picsum.photos/seed/gg-nails/300/300', 'https://picsum.photos/seed/gg-nails-cover/900/500',
   'Mumbai', 'Lower Parel', 'Kamala Mills, Lower Parel', 18.9977, 72.8258, false, true, 10, 5, '{English,Hindi}', true, 'live'),
  ('20000000-0000-0000-0000-000000000004', 'Meher Bridal Studio', 'meher-bridal-studio',
   'Full bridal packages: makeup, hair, draping and mehndi coordination.',
   'https://picsum.photos/seed/gg-meher/300/300', 'https://picsum.photos/seed/gg-meher-cover/900/500',
   'Mumbai', 'Juhu', '12 Juhu Tara Road', 19.1075, 72.8263, true, true, 30, 15, '{English,Hindi,Marathi}', true, 'live'),
  ('20000000-0000-0000-0000-000000000005', 'Glow Lounge Salon', 'glow-lounge-salon',
   'Facials, hair spa and keratin treatments by certified stylists.',
   'https://picsum.photos/seed/gg-glow/300/300', 'https://picsum.photos/seed/gg-glow-cover/900/500',
   'Mumbai', 'Powai', 'Hiranandani Gardens, Powai', 19.1176, 72.9060, true, true, 12, 6, '{English,Hindi}', false, 'live'),
  ('20000000-0000-0000-0000-000000000006', 'Riya Styles', 'riya-styles',
   'Party makeup and hairstyling at your doorstep.',
   'https://picsum.photos/seed/gg-riya/300/300', 'https://picsum.photos/seed/gg-riya-cover/900/500',
   'Mumbai', 'Thane West', null, 19.2183, 72.9781, true, false, 15, 3, '{Hindi,Marathi}', true, 'live')
on conflict (id) do nothing;

insert into public.vendor_categories (vendor_id, category_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006')
on conflict do nothing;

insert into public.services (id, vendor_id, category_id, name, description, duration_min, price_home, price_salon, is_package, includes) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Party Makeup (HD)', 'HD makeup with lashes and basic hairstyling.', 90, 4500, null, false, '{}'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
   'Bridal Airbrush Package', 'Wedding-day airbrush makeup, hairdo and draping.', 240, 28000, null, true,
   '{"Airbrush makeup","Bridal hairdo","Saree/lehenga draping","Mink lashes"}'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'Bridal Mehndi (full hands & feet)', 'Elbow-length hands plus feet, organic henna.', 300, 11000, 9500, true,
   '{"Organic henna","Hands to elbows","Feet to ankles","Name hidden in design"}'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'Festive Mehndi (both hands)', 'Arabic style, front and back.', 60, 1200, 900, false, '{}'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'Gel Extensions', 'Soft-gel extensions with a solid colour.', 75, null, 1800, false, '{}'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'Royal Bride Package', 'Trial session, wedding-day makeup, hair and draping, plus one family member.', 360, 45000, 40000, true,
   '{"Pre-wedding trial","HD bridal makeup","Hair & draping","One family member makeup"}'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'Hydra Facial', 'Deep cleanse, exfoliation and hydration.', 60, 3500, 2800, false, '{}'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001',
   'Engagement Look', 'Makeup and hairstyling for engagement or reception.', 120, 6500, null, false, '{}')
on conflict (id) do nothing;

insert into public.service_addons (service_id, name, price, duration_min)
select s.id, a.name, a.price, a.mins
from (values
  ('30000000-0000-0000-0000-000000000001'::uuid, 'Mink lashes', 800, 0),
  ('30000000-0000-0000-0000-000000000001'::uuid, 'Saree draping', 700, 20),
  ('30000000-0000-0000-0000-000000000004'::uuid, 'Feet (front)', 600, 30),
  ('30000000-0000-0000-0000-000000000005'::uuid, 'Nail art (per hand)', 500, 20),
  ('30000000-0000-0000-0000-000000000007'::uuid, 'LED therapy', 900, 15)
) as a(service_id, name, price, mins)
join public.services s on s.id = a.service_id
where not exists (select 1 from public.service_addons x where x.service_id = a.service_id and x.name = a.name);

insert into public.portfolio_items (vendor_id, image_url, caption, sort_order)
select v.id, 'https://picsum.photos/seed/' || v.slug || '-' || g || '/800/800', null, g
from public.vendors v, generate_series(1, 6) g
where v.id::text like '20000000-%'
  and not exists (select 1 from public.portfolio_items p where p.vendor_id = v.id);

-- Ratings are normally derived from real reviews; seed them directly for the demo.
-- (auth.uid() is null in the SQL editor, so the column guard allows this.)
update public.vendors set rating_avg = r.avg, rating_count = r.cnt, completed_count = r.done
from (values
  ('20000000-0000-0000-0000-000000000001'::uuid, 4.9, 212, 340),
  ('20000000-0000-0000-0000-000000000002'::uuid, 4.8, 486, 610),
  ('20000000-0000-0000-0000-000000000003'::uuid, 4.7, 158, 230),
  ('20000000-0000-0000-0000-000000000004'::uuid, 4.9, 97,  120),
  ('20000000-0000-0000-0000-000000000005'::uuid, 4.4, 61,  95),
  ('20000000-0000-0000-0000-000000000006'::uuid, 4.6, 44,  70)
) as r(id, avg, cnt, done)
where vendors.id = r.id;
