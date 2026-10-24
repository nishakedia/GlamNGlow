# Roadmap

✅ built · 🧩 placeholder screen, with navigation and data hooks ready · ⬜ not started

## Foundation

- ✅ Expo SDK 57 + TypeScript strict, path alias `@/`
- ✅ Theme tokens (colours, Fraunces + Inter, spacing, radius, shadow)
- ✅ React Navigation: root stack, customer tabs, vendor tabs, **role switching**
- ✅ React Query client, key factory, AppState focus handling
- ✅ Zustand stores: auth, booking draft, filters (persisted where useful)
- ✅ Env validation with an on-screen setup message
- ✅ Shared UI kit: Text, Button, Card, Chip, Badge/VerifiedBadge, SearchBar, Rating, Skeleton, StateView/ErrorState, SectionHeader, FormField, VendorCard, ComingSoon
- ✅ EAS profiles (development / preview / production) with update channels
- ✅ Web export + Netlify / Cloudflare Pages / Vercel configs
- ✅ CI: typecheck, lint, web export. Optional EAS Update on push

## Backend

- ✅ Schema, triggers and `vendor_cards` read model
- ✅ RLS on every table, plus column guard triggers
- ✅ Pricing (`quote_booking`), availability (`get_available_slots`), search (`search_vendors`)
- ✅ Direct + broadcast booking, first-to-accept matching, lifecycle RPCs, expiry cron
- ✅ Storage buckets + policies (public: avatars/portfolio/reviews · private: kyc/chat)
- ✅ Realtime publication
- ✅ Edge Functions: Razorpay create order / verify / webhook, push sender
- ✅ Seed data + smoke test
- ⬜ Automated face match for KYC (plug a provider into `vendor_kyc.match_score`)
- ⬜ Admin web panel (today: SQL Editor + `admin_review_vendor`)
- ⬜ Refund flow when a paid direct booking is declined or cancelled (Razorpay refunds API from an Edge Function)
- ⬜ Payout automation (RazorpayX) instead of manual `payouts` rows

## Customer app

| Screen | Status | Notes |
| --- | --- | --- |
| Home | ✅ | Reference implementation |
| Explore / Search results | ✅ | Debounced text search, home/salon, verified, price presets, sort, infinite scroll |
| Sign in (phone OTP + email OTP) | ✅ | |
| Vendor profile | ✅ | Trust badges, portfolio, services/packages, reviews. Add a favourite toggle (`useToggleFavorite` ready) |
| Service detail with add-ons | 🧩 | `useService`; worked example in ADDING_A_FEATURE.md |
| Booking details (mode, date, time, address) | 🧩 | `useAvailableSlots`, `useAddresses` |
| Address picker | 🧩 | `searchPlaces`, `useCurrentLocation`, `useSaveAddress` |
| Order review | 🧩 | `useQuote`, `useCreateBooking` |
| Payment | 🧩 | `usePayForBooking` (native + web checkout ready) |
| Confirmation | 🧩 | |
| Broadcast request + waiting | 🧩 | `useCreateBooking` (broadcast), `useBooking` realtime |
| Tracking (timeline + live map) | 🧩 | `useBooking`, `useBookingEvents`, `useVendorLocation`. Needs `Map.tsx`/`Map.web.tsx` |
| Chat | 🧩 | `useMessages`, `useSendMessage` |
| My bookings | ✅ | Upcoming / past, status badges |
| Rate & review | 🧩 | `useSubmitReview` |
| Profile | ✅ | Sign out, role switch / become an artist. Add an edit-profile form (`useUpdateProfile`) |

## Artist app

| Screen | Status | Notes |
| --- | --- | --- |
| Become an artist (signup) | 🧩 | `useCreateVendor` |
| KYC (ID + selfie) | 🧩 | `useSubmitKyc` (uploads to private bucket) |
| Portfolio & pricing setup | 🧩 | `useAddPortfolioItem`, `useUpsertService`, `useSubmitForReview` |
| Under review | 🧩 | `useMyVendor` |
| Dashboard | ✅ | Earnings snapshot, today's schedule, switch back to customer |
| Requests inbox | 🧩 | `useIncomingRequests` (realtime), `useRespondToOffer`, `useRespondToBooking`. Tab badge already live |
| Job detail (start trip, share location, complete) | 🧩 | `useAdvanceBooking`, `usePublishLocation` |
| Availability calendar | 🧩 | `useAvailability`, `useSaveWeeklyHours`, `useAddTimeOff`, `useMonthBookings` |
| Service catalog | 🧩 | `useMyServices`, `useUpsertService`, `useSetServiceActive` |
| Portfolio manager | 🧩 | `useMyPortfolio`, `useAddPortfolioItem`, `useDeletePortfolioItem` |
| Earnings & payouts | 🧩 | `useEarningsSummary`, `useCompletedJobs`, `usePayouts` |

## Suggested build order

1. Service detail → Booking details → Address picker → Order review → Confirmation (pay at service). This completes the core customer loop.
2. Vendor signup → KYC → Setup → Under review, plus the Requests inbox. Artists can then onboard and accept work.
3. Payment (Razorpay test mode), then Tracking + Chat.
4. Broadcast request/waiting, Rate & review.
5. Calendar, Catalog, Portfolio, Earnings.
6. Polish: favourites, edit profile, deep links from push notifications (the `data.screen` field is already sent), empty-state illustrations.
