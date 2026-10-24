# Deploying Glam & Glow for free

This guide takes you from zero to a live backend, a public web app and an installable Android app, using only free tiers. Work through it top to bottom. Each step says what it costs and what the free limits are.

- [0. What's free (and what isn't)](#0-whats-free-and-what-isnt)
- [1. Supabase project](#1-supabase-project-free)
- [2. Database: schema, seed, smoke test](#2-database-schema-seed-smoke-test)
- [3. Auth: phone OTP and email OTP](#3-auth-phone-otp-and-email-otp)
- [4. Edge Functions and secrets](#4-edge-functions-and-secrets)
- [5. Android app](#5-android-app-free)
- [6. Web app](#6-web-app-free)
- [7. Payments with Razorpay](#7-payments-with-razorpay)
- [8. Push notifications](#8-push-notifications-free)
- [9. Maps and address search](#9-maps-and-address-search)
- [10. Running the marketplace (admin tasks)](#10-running-the-marketplace-admin-tasks)
- [11. Troubleshooting](#11-troubleshooting)

---

## 0. What's free (and what isn't)

| Piece | Service | Free tier (checked Oct 2026; confirm on each pricing page) |
| --- | --- | --- |
| Database, auth, storage, realtime, functions | **Supabase Free** | 2 projects · 500 MB database · 1 GB file storage · 5 GB egress · 50,000 monthly active users · 500,000 Edge Function calls · 200 concurrent realtime connections · 2M realtime messages/month. **Paused after 1 week without activity** (one click to restore). |
| Android builds | **EAS Build Free** | Up to 15 Android + 15 iOS builds, low-priority queue (can wait 90+ min at peak), 45-min timeout |
| Over-the-air updates | **EAS Update Free** | 1,000 monthly active users, 100 GiB bandwidth |
| Web hosting | **Netlify / Cloudflare Pages / Vercel Hobby** | Free static hosting. Vercel Hobby is for **non-commercial** use only, so prefer Netlify or Cloudflare Pages for a real business |
| Push notifications | **Expo Push + Firebase Cloud Messaging** | Free |
| Address search | **OpenStreetMap via Photon** | Free, fair use, no key (the app's default) |
| Payments | **Razorpay** | Test mode is free. Live mode has no monthly fee but takes a cut of each transaction (about 2% for domestic cards/UPI) and needs business KYC |
| Native maps on Android | **Google Maps SDK for Android** | Map loads cost $0, but Google requires a billing-enabled Cloud account to issue a key |

**Not free, and how to avoid paying for now:**

- **SMS OTP.** Supabase needs an SMS provider (Twilio, MessageBird, Vonage, Textlocal). Real SMS costs money, and in India requires DLT registration. Use **test phone numbers** for demos and the free **email OTP** for real users (both covered in [section 3](#3-auth-phone-otp-and-email-otp)).
- **Google Play Store.** $25 one-time. Until then, share the APK directly ([section 5](#5-android-app-free)).
- **Apple App Store.** $99/year, and needed for any iOS build. iPhone users can use the web app ([section 6](#6-web-app-free)) for free.

---

## 1. Supabase project (free)

1. Sign up at <https://supabase.com> and click **New project**.
2. Pick the region closest to your users. For India, choose **South Asia (Mumbai)**.
3. Save the database password somewhere safe.
4. When it's ready, open **Project Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - The **service_role** key stays secret. It is only used inside Edge Functions and is injected automatically, so never put it in the app.
5. Locally: `cp .env.example .env` and paste the two values.

## 2. Database: schema, seed, smoke test

### Option A: Supabase CLI (recommended)

```bash
npx supabase login
npx supabase link --project-ref <project-ref>     # the ref is in your project URL
npx supabase db push                              # applies supabase/migrations/*
```

Then load demo data. Either run `npx supabase db push --include-seed`, or paste `supabase/seed.sql` into **SQL Editor** and run it.

### Option B: SQL Editor only (no CLI)

In **SQL Editor → New query**, paste and run these in order:

1. `supabase/migrations/20261014000000_init.sql`
2. `supabase/migrations/20261014000100_booking_logic.sql`
3. `supabase/seed.sql`

### Verify

Paste `supabase/tests/smoke_test.sql` into the SQL Editor and run it. It creates throwaway users, books, races two artists for a broadcast, completes a job, leaves a review and then **rolls everything back**. The output should end with:

```
NOTICE:  ALL SMOKE TESTS PASSED
```

If the last statement of the booking migration fails with `extension "pg_cron" is not available`, enable it under **Database → Extensions → pg_cron** and re-run just the last two lines of `20261014000100_booking_logic.sql`. pg_cron expires unanswered broadcast requests every minute.

### Make yourself an admin

Sign in to the app once (see section 3), then in SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com' or phone = '919876543210');
```

## 3. Auth: phone OTP and email OTP

The sign-in screen supports both. Phone is the default, with a "Use email instead" link.

### Phone OTP for free (development and demos)

1. **Authentication → Sign In / Providers → Phone**: enable it.
2. Supabase asks for an SMS provider. A free Twilio trial account works, and so do real credentials from any supported provider.
3. In the same panel, add **test phone numbers and OTPs**, for example `919876543210=123456`. Test numbers never send an SMS and never cost anything. Enter `98765 43210` in the app and use `123456` as the code.

### Phone OTP in production (paid)

Configure a real SMS provider. In India you must register your sender ID and message template on the DLT platform; your SMS provider walks you through it. Budget roughly ₹0.15–0.25 per OTP SMS.

### Email OTP (free, works for real users)

1. **Authentication → Sign In / Providers → Email**: enabled by default.
2. **Authentication → Email Templates → Magic Link**: make the email show the code by including `{{ .Token }}`, e.g.:
   ```html
   <h2>Your Glam & Glow code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   ```
3. Supabase's built-in mailer has a low hourly limit and is meant for testing. For real traffic, add a free SMTP provider under **Authentication → Emails → SMTP Settings**. Brevo and Resend both have free tiers.

## 4. Edge Functions and secrets

The four functions live in `supabase/functions/`:

| Function | Called by | Purpose |
| --- | --- | --- |
| `razorpay-create-order` | App (Payment screen) | Creates a Razorpay order for a booking |
| `razorpay-verify-payment` | App after checkout | Verifies the HMAC signature and marks the booking paid |
| `razorpay-webhook` | Razorpay servers | Backstop if the app closes mid-payment; also handles failures and refunds |
| `send-push` | Database webhooks | Sends push notifications via Expo Push |

```bash
# Secrets (from Razorpay → Settings → API Keys; the webhook secret is any string you choose)
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_WEBHOOK_SECRET=choose-a-long-random-string

# Deploy all functions (the webhook's JWT check is disabled in supabase/config.toml)
npx supabase functions deploy
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### Wire up push triggers

Under **Database → Webhooks → Create a new hook**, create four hooks. For each one, set type **Supabase Edge Functions**, function `send-push`, method POST, and tick **Add auth header with service key**.

| Name | Table | Events |
| --- | --- | --- |
| `push-offer` | `booking_offers` | Insert |
| `push-booking-insert` | `bookings` | Insert |
| `push-booking-status` | `bookings` | Update |
| `push-message` | `messages` | Insert |

## 5. Android app (free)

1. Create a free account at <https://expo.dev>.
2. Link the project:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init            # prints a project ID
   ```
   Put that ID in `.env` as `EAS_PROJECT_ID`.
3. **Give EAS your env vars.** Cloud builds don't see your local `.env`, because it's gitignored. Add each value once per environment (`development`, `preview`, `production`):
   ```bash
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co --visibility plaintext
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value xxx --visibility plaintext
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value rzp_test_xxx --visibility plaintext
   npx eas-cli@latest env:create --environment preview --name EAS_PROJECT_ID --value <id> --visibility plaintext
   ```
   You can also add them in the expo.dev dashboard under **Project → Environment variables**. Build profiles in `eas.json` already point at the matching environment.
4. **Build an installable APK:**
   ```bash
   npm run build:android:preview
   ```
   When it finishes, EAS prints a link and a QR code. Anyone with the link can download and install the APK (Android asks them to allow "install unknown apps"). That's your free distribution channel. You can also attach the APK to a GitHub Release.
5. **For day-to-day development**, build the dev client once (`npm run build:android:dev`), install it, then run `npx expo start`. This is needed for Razorpay, push notifications and Google Maps, which Expo Go doesn't include.
6. **Ship JS-only fixes without rebuilding:**
   ```bash
   npm run update:preview
   ```
   Installed preview APKs download the update on next launch. `.github/workflows/eas-update.yml` can do this automatically on every push to `main`. Set the repo variable `ENABLE_EAS_UPDATE=true` and add an `EXPO_TOKEN` secret.
7. **Later, optionally:** run `npx eas-cli build --profile production --platform android` to get an `.aab`, then `eas submit` it to Google Play ($25 one-time developer fee).

## 6. Web app (free)

The same codebase exports to a static website. That covers iPhone users without an App Store account, and gives you a link to share.

```bash
npm run build:web      # outputs dist/
```

What works on web: browsing, search, vendor profiles, sign-in, bookings, Razorpay (via `razorpay.web.ts`, which uses Razorpay's web checkout) and chat. What doesn't: native push and native maps.

### Netlify (recommended, allows commercial use)

1. Push the repo to GitHub, then go to <https://app.netlify.com> → **Add new site → Import from Git**.
2. `netlify.toml` already sets the build command, the `dist` output folder and SPA redirects.
3. **Site settings → Environment variables**: add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_RAZORPAY_KEY_ID`.
4. Deploy. You get `https://<name>.netlify.app`, and every push redeploys.

### Cloudflare Pages (also free and commercial-friendly)

**Workers & Pages → Create → Pages → Connect to Git.** Set the build command to `npx expo export --platform web`, the output directory to `dist`, and add the same env vars plus `NODE_VERSION=20`. `public/_redirects` handles SPA routing.

### Vercel (Hobby plan is non-commercial)

Import the repo. `vercel.json` already contains the build settings. Add the env vars.

After deploying, add your web URL under Supabase **Authentication → URL Configuration → Site URL** so auth emails link back correctly.

## 7. Payments with Razorpay

1. Sign up at <https://razorpay.com>. **Test mode** works immediately, with no KYC and no cost.
2. **Settings → API Keys → Generate test key.**
   - Key ID → `EXPO_PUBLIC_RAZORPAY_KEY_ID` (app) and the `RAZORPAY_KEY_ID` secret
   - Key Secret → the `RAZORPAY_KEY_SECRET` secret (**never** in the app)
3. **Settings → Webhooks → Add new webhook**:
   - URL: `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook`
   - Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
4. Test in the checkout with UPI ID `success@razorpay` (or `failure@razorpay`), or with the test cards from Razorpay's docs (search "Razorpay test card details").
5. **Going live:** complete business KYC in Razorpay, generate live keys, replace the test values, then redeploy the functions and rebuild or redeploy the app. Customers can also choose **Pay at service**, which needs no gateway at all.

How the money flow is secured: the app never decides the amount. `razorpay-create-order` reads the booking total from the database, and `razorpay-verify-payment` checks Razorpay's HMAC signature with the secret key before marking anything paid.

## 8. Push notifications (free)

Expo Push is free and delivers through Firebase Cloud Messaging (Android) and APNs (iOS).

1. Create a free Firebase project at <https://console.firebase.google.com>. Add an **Android app** with package `com.glamandglow.app`, and download `google-services.json`.
2. Upload it to EAS as a file variable: `npx eas-cli env:create --environment preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`. For local builds, keep it in the project root (it's gitignored).
3. Give Expo permission to send through FCM: in Firebase, go to **Project settings → Service accounts → Generate new private key**. Then run `npx eas-cli credentials`, choose Android, then **Google Service Account → FCM V1**, and upload the key.
4. Rebuild the app. On sign-in it registers its Expo push token in `push_tokens`, and the `send-push` function plus the database webhooks from section 4 handle the rest.

Remote push only works in development or production builds on a physical device, not in Expo Go or on web.

## 9. Maps and address search

- **Address search** uses free OpenStreetMap data via Photon by default (`EXPO_PUBLIC_PLACES_PROVIDER=osm`). To switch to Google Places, set `EXPO_PUBLIC_PLACES_PROVIDER=google` and `EXPO_PUBLIC_GOOGLE_PLACES_KEY`. Places requests are billed beyond Google's monthly free credit.
- **Map view** (live tracking): on iOS, react-native-maps uses Apple Maps with no key. On Android it needs a Google Maps SDK key. Create one in Google Cloud Console with **Maps SDK for Android** enabled and set `GOOGLE_MAPS_ANDROID_KEY` (as an EAS env var for cloud builds). Native map loads have no charge, but Google requires a billing account on file. You only need this once you build the tracking map.

## 10. Running the marketplace (admin tasks)

All of these run in the Supabase SQL Editor (or Table Editor).

**Review a new artist.** Look at their documents under **Storage → kyc → `<user-id>/`**, compare the selfie with the ID photo, then:

```sql
-- See who is waiting
select v.id, v.business_name, v.city, k.id_doc_type, k.submitted_at
from vendors v join vendor_kyc k on k.vendor_id = v.id
where v.status in ('kyc_pending', 'under_review') order by k.submitted_at;

-- Approve (makes them live + verified) or reject with a note
select admin_review_vendor('<vendor-id>', true,  'Looks good');
select admin_review_vendor('<vendor-id>', false, 'ID photo is blurry, please re-upload');
```

**Record a payout:**

```sql
insert into payouts (vendor_id, amount, period_start, period_end, status, reference)
values ('<vendor-id>', 12500, '2026-10-01', '2026-10-15', 'paid', 'UTR123456');
```

**Tune matching and fees.** Edit `app_config()` in `supabase/migrations/20261014000100_booking_logic.sql` (broadcast window, fan-out size, salon radius, travel fee, platform fee %). Re-run just that function in the SQL Editor.

**Replace demo data.** Delete the six seeded vendors when real artists join:

```sql
delete from vendors where id::text like '20000000-%';
```

## 11. Troubleshooting

| Symptom | Fix |
| --- | --- |
| App shows "Glam & Glow needs configuration" | `.env` is missing or wrong. Fix it, then run `npx expo start -c`. For EAS builds, check the EAS env vars (section 5.3) |
| Home shows "Something went wrong" | Migrations or seed not applied, or the anon key belongs to a different project. Run the smoke test |
| Home loads but has no artists | Seed not run, or all vendors are non-`live` |
| OTP never arrives | Use a test phone number, check the SMS provider logs, or switch to email OTP |
| Email arrives with a link but no code | Add `{{ .Token }}` to the Magic Link template (section 3) |
| `RazorpayCheckout` undefined / crashes | You're in Expo Go. Use a development build |
| Payment succeeded but booking still unpaid | Check the `razorpay-webhook` URL/secret, then **Edge Functions → Logs** |
| No push notifications | Physical device + dev/production build? `push_tokens` row present? Webhooks created? FCM V1 key uploaded? |
| Broadcast requests never expire | pg_cron not enabled (section 2) |
| Supabase project paused | Free projects pause after a week idle. **Restore** from the dashboard |
| Android map is blank | Missing or invalid `GOOGLE_MAPS_ANDROID_KEY`, or Maps SDK for Android not enabled |
