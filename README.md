# Glam & Glow

A booking marketplace for beauty and bridal services: makeup artists, mehndi artists, nail technicians, bridal packages and salon treatments. Customers can book any service **at home** or **at the artist's salon/studio**. Artists use the same app, switched into "artist mode", to manage requests, availability, services, portfolio and earnings.

Built with Expo (React Native + TypeScript) and Supabase. **Every piece can run on free tiers.** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) walks through it step by step.

---

## What's in this repo

| Area | Status |
| --- | --- |
| Project scaffold, config, theme, navigation, role switching | ✅ Done |
| Supabase schema, RLS policies, storage, realtime, cron | ✅ Done and tested (see [Testing](#testing)) |
| Direct booking + broadcast matching (first to accept wins) | ✅ Done in SQL, tested |
| Razorpay order / verify / webhook Edge Functions | ✅ Written |
| Push notification Edge Function (Expo Push → FCM/APNs) | ✅ Written |
| **Home screen** (categories, search entry, top vendors from Supabase) | ✅ Built end to end. This is the reference pattern |
| Search results with home/salon, price, verified and sort filters | ✅ Built |
| Phone OTP sign-in (+ free email OTP fallback) | ✅ Built |
| Vendor profile, My bookings, Profile with role switch, Vendor dashboard | ✅ Built |
| Booking flow, payment, tracking, chat, reviews, vendor tools | 🧩 Wired into navigation with data hooks ready. Screens are placeholders |

[docs/ROADMAP.md](docs/ROADMAP.md) has the screen-by-screen checklist.

## Tech stack

- **App:** Expo SDK 57, React Native 0.86, TypeScript (strict)
- **Navigation:** React Navigation 7 (native-stack + bottom-tabs), role-switched at the root
- **Server state:** TanStack Query 5. **Client state:** Zustand 5 (auth session, booking draft, filters)
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres + PostGIS, Auth with phone OTP, Storage, Realtime, Edge Functions, pg_cron)
- **Payments:** Razorpay (UPI, cards, netbanking, wallets) plus pay-at-service
- **Maps & places:** react-native-maps, with address search through free OpenStreetMap (Photon) by default and Google Places as an option
- **Media:** expo-image-picker and expo-image. **Push:** expo-notifications through Expo Push (FCM/APNs)
- **Build & ship:** EAS Build, EAS Update (OTA), and a static web export for Netlify, Cloudflare Pages or Vercel

## Quick start (local, about 10 minutes)

**Requirements:** Node 20+, a free [Supabase](https://supabase.com) account, and an Android phone with [Expo Go](https://expo.dev/go) (or a browser).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#    → set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
#      (Supabase → Project Settings → API)

# 3. Create the database (pick one)
npx supabase login && npx supabase link --project-ref <your-ref> && npx supabase db push
#    …or paste both files in supabase/migrations/ and then supabase/seed.sql into the Supabase SQL Editor

# 4. Run
npx expo start          # press "w" for web, or scan the QR code with Expo Go
```

The Home screen should now show six categories and six demo artists from `supabase/seed.sql`.

> **Expo Go vs development build:** Home, search, vendor profiles and sign-in work in Expo Go. Razorpay checkout, remote push notifications and Google Maps on Android need a **development build** (`npm run build:android:dev`, free on EAS). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#5-android-app-free).

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run web` | Run in the browser |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Expo config) |
| `npm run build:web` | Static web build into `dist/` |
| `npm run build:android:dev` | EAS development build (APK with dev client) |
| `npm run build:android:preview` | EAS installable APK for testers |
| `npm run update:preview` | Push an over-the-air JS update to the `preview` channel |
| `npm run db:push` | Apply `supabase/migrations` to your linked project |
| `npm run db:types` | Regenerate `src/types/database.ts` from your live schema |
| `npm run functions:deploy` | Deploy all Edge Functions |

## Project structure

```
src/
  App.tsx                 providers: SafeArea, React Query, fonts, navigation
  navigation/             RootNavigator (role switch), CustomerTabs, VendorTabs
  features/
    auth/ home/ search/ vendor-profile/ booking/ payment/
    tracking/ bookings-list/ profile/
    vendor-app/           onboarding/ dashboard/ requests/ calendar/ catalog/ portfolio/ earnings/
      └─ each feature: screens/  components/  api.ts (React Query hooks)
  components/             shared UI (Text, Button, Card, VendorCard, Chip, …)
  store/                  Zustand: authStore, bookingDraftStore, filtersStore
  services/               supabase client, query client + key factory, env, places, storage, push
  theme/                  colors, typography, spacing tokens
  hooks/  utils/  types/
supabase/
  migrations/             schema, RLS, RPCs (booking + matching), storage, realtime, cron
  functions/              razorpay-create-order, razorpay-verify-payment, razorpay-webhook, send-push
  seed.sql                demo categories + vendors
  tests/smoke_test.sql    end-to-end backend test (runs in a rolled-back transaction)
docs/                     architecture, backend, matching, deployment, how-to guides
```

## Documentation

| Doc | Read it when… |
| --- | --- |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | You want it live, for free: Supabase, web hosting, Android APK, payments, push |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | You want the big picture: layers, state rules, navigation and role switching |
| [ADDING_A_FEATURE.md](docs/ADDING_A_FEATURE.md) | You're building one of the placeholder screens (walks through the Home pattern) |
| [BACKEND.md](docs/BACKEND.md) | You're touching tables, RLS, RPCs, storage or Edge Functions |
| [MATCHING.md](docs/MATCHING.md) | You need to understand direct vs broadcast booking |
| [ROADMAP.md](docs/ROADMAP.md) | You want to know what's left |

## Testing

- **App:** `npm run typecheck && npm run lint`. CI runs both and a web export on every push ([.github/workflows/ci.yml](.github/workflows/ci.yml)).
- **Backend:** after deploying the schema, paste [supabase/tests/smoke_test.sql](supabase/tests/smoke_test.sql) into the Supabase SQL Editor and run it. It plays a guest, a customer and three artists through RLS checks, pricing, direct booking, double-booking prevention, a broadcast race, the job lifecycle, reviews and expiry. Then it rolls everything back. You should see `ALL SMOKE TESTS PASSED`.

## Design

Cherry cola `#7B3A34` (primary), power blue `#2C477A` (secondary/trust), ivory `#FAF6F2` (background), charcoal `#241D1B` (text). Fraunces serif for headings, Inter for UI text. Card layouts with generous whitespace, and verified badges shown wherever a vendor appears. All tokens live in [src/theme](src/theme).
