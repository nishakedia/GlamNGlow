Glam & Glow is an Expo/React Native (TypeScript) booking marketplace backed by Supabase. Read `docs/ARCHITECTURE.md` before making structural changes, and `docs/ADDING_A_FEATURE.md` before building a screen.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently SDK 57).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK-compatible versions
npx expo start              # dev server (-c to clear cache after changing .env)
npm run typecheck           # tsc --noEmit
npm run lint                # eslint
npm run build:web           # static web export to dist/
npm run db:types            # regenerate src/types/database.ts after schema changes
```

Run typecheck and lint before declaring any task done. If you change SQL, update `supabase/tests/smoke_test.sql` when booking rules change.

## Project conventions

- **Navigation is React Navigation** (native-stack + bottom-tabs), not Expo Router. Routes and params are typed in `src/types/navigation.ts`; screens are registered in `src/navigation/RootNavigator.tsx`. Role switching = `authStore.activeRole` choosing `CustomerTabs` vs `VendorTabs`.
- **Feature folders**: `src/features/<feature>/{screens,components,api.ts}`. Only `api.ts` files import `supabase`.
- **Server state → React Query** (keys from `qk` in `src/services/queryClient.ts`). **Client-only state → Zustand** (`src/store`). Never mirror query data into a store.
- Supabase results go through `unwrap` / `unwrapMaybe` / `assertOk` from `src/services/supabase.ts`.
- Forms: React Hook Form + Zod (`zodResolver`).
- Styling: `Text` variants and tokens from `@/theme`; no raw hex colours or font sizes in components.
- Platform-specific code: `file.ts` + `file.web.ts`. Never import `react-native-maps` or `react-native-razorpay` from code that runs on web.
- Business rules that must be trusted (prices, availability, matching, status changes) live in Postgres functions under `supabase/migrations`, not in the app.

## Building with EAS

Use EAS to build and ship (`npx eas-cli@latest build`, `npx eas-cli@latest update`). Cloud builds read env vars from EAS environments, not `.env` (see `docs/DEPLOYMENT.md`).

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. Razorpay, remote push and Google Maps on Android need a development build (`npm run build:android:dev`).
