# Building a screen: the Home reference pattern

The Home screen is built end to end on purpose: every other screen should be built the same way. This guide walks through how Home is put together, then applies the same steps to a placeholder screen.

## Anatomy of the Home feature

```
src/features/home/
├── api.ts                     data: fetchX → xQueryOptions → useX
├── components/
│   ├── HomeHeader.tsx         greeting + location picker
│   ├── CategoryGrid.tsx       owns its own loading / error / data states
│   ├── ModeToggle.tsx         "Any / At home / At salon", pure UI
│   └── BroadcastCta.tsx       entry to broadcast matching
└── screens/
    └── HomeScreen.tsx         composes it all in one FlatList
```

### 1. `api.ts`: the only file that talks to Supabase

```ts
// 1. Plain async function. Throws on error (unwrap) so React Query can catch it.
export async function fetchTopVendors({ mode, limit = 10 }: TopVendorsFilters) {
  let query = supabase.from('vendor_cards').select('*').eq('status', 'live');
  if (mode === 'home') query = query.eq('offers_home', true);
  if (mode === 'salon') query = query.eq('offers_salon', true);
  return unwrap(await query.order('rating_avg', { ascending: false }).limit(limit));
}

// 2. Options factory: key + fn + cache policy, reusable for prefetching and invalidation.
export const topVendorsQueryOptions = (filters: TopVendorsFilters) =>
  queryOptions({
    queryKey: qk.vendors.top(filters),      // from the central key factory
    queryFn: () => fetchTopVendors(filters),
    staleTime: 5 * 60_000,
  });

// 3. The hook screens call.
export function useTopVendors(filters: TopVendorsFilters) {
  return useQuery({ ...topVendorsQueryOptions(filters), placeholderData: (prev) => prev });
}
```

Rules:

- Types come from `src/types/models.ts`, which derives them from the database types, so a schema change shows up as a type error.
- Query keys come from `qk` in `src/services/queryClient.ts`. Add new keys there.
- Use `unwrap` for lists and `.single()`, `unwrapMaybe` for `.maybeSingle()`, and `assertOk` for writes that return nothing.
- Mutations invalidate the keys they affect in `onSuccess`.

### 2. Components own their states

`CategoryGrid` calls `useCategories()` itself and renders a skeleton grid, an `ErrorState` with retry, or the tiles. The screen doesn't need to know. The four states, **pending → error → empty → data**, always use the shared `Skeleton`, `ErrorState` and `StateView` components.

### 3. The screen composes

`HomeScreen`:

- Reads client state from Zustand with **selectors** (`useFiltersStore((s) => s.mode)`), so it only re-renders when that slice changes.
- Uses a single `FlatList` with everything above the list in `ListHeaderComponent`. That gives one scroll container, virtualised rows and pull-to-refresh.
- Refreshes by **invalidating query keys**, not by calling fetchers directly.
- Navigates with typed routes (`navigation.navigate('VendorProfile', { vendorId })`).
- Wraps account-only actions in `useRequireAuth()`, so guests get the sign-in sheet.

### 4. Styling

- `Text variant="h2" color="textMuted"` instead of raw `fontSize`/`color`.
- Tokens from `@/theme` (`spacing.lg`, `radius.md`, `colors.primary`), never literal hex values.
- `Card`, `Chip`, `Badge`, `VerifiedBadge`, `Button` and `SectionHeader` cover most layouts.

---

## Worked example: building `ServiceDetailScreen`

The placeholder lives at `src/features/vendor-profile/screens/ServiceDetailScreen.tsx`, and its data hook `useService(serviceId)` already exists in `vendor-profile/api.ts`.

**1. Check the data hook.** `useService` returns the service plus `service_addons`. Nothing to add.

**2. Build the screen:**

```tsx
export function ServiceDetailScreen({ route, navigation }: RootStackScreenProps<'ServiceDetail'>) {
  const { vendorId, serviceId } = route.params;
  const service = useService(serviceId);
  const vendor = useVendor(vendorId);
  const requireAuth = useRequireAuth();
  const { mode, addonIds, startDirect, update, toggleAddon } = useBookingDraftStore();

  if (service.isPending) return <Skeleton height={240} />;
  if (service.isError) return <ErrorState error={service.error} onRetry={service.refetch} />;
  const s = service.data;

  const continueToBooking = () =>
    requireAuth(() => {
      startDirect({ vendorId, serviceId, categoryId: s.category_id, mode });
      navigation.navigate('BookingDetails');
    });

  return (
    <Screen scroll footer={<Button title="Continue" onPress={continueToBooking} />}>
      {/* hero, name, duration, includes[] for packages */}
      {/* mode toggle: only show modes where price_home / price_salon is non-null */}
      {/* add-on rows: <Chip selected={addonIds.includes(a.id)} onPress={() => toggleAddon(a.id)} /> */}
    </Screen>
  );
}
```

**3. Keep business rules on the server.** Show prices from `useQuote()` on Order Review, but never compute the final total in the app. `create_booking` recomputes and validates everything.

**4. Check it:** `npm run typecheck && npm run lint`, then run it with `npx expo start`.

## Adding a brand-new feature

1. `mkdir -p src/features/<name>/{screens,components}` and create `api.ts`.
2. Add any routes to `RootStackParamList` (or a tab param list) in `src/types/navigation.ts`.
3. Register the screen in `src/navigation/RootNavigator.tsx`, inside the signed-in group if it needs an account.
4. If it needs new tables: add a migration (see [BACKEND.md](BACKEND.md#changing-the-schema)), run `npm run db:types`, and add any new keys to `qk`.
5. Need realtime? Call `useRealtimeInvalidate({ channel, table, filter, invalidate: [qk...] })` in the hook.
6. Platform-specific code? Create `thing.ts` plus `thing.web.ts`. Never import native-only modules such as `react-native-maps` from code that runs on web.

## Checklist before you call a screen done

- [ ] Loading, error (with retry), empty and data states
- [ ] Works signed out, or is in the signed-in navigator group / behind `useRequireAuth`
- [ ] No `supabase` import in the screen or its components
- [ ] Text uses `Text` variants, spacing uses tokens
- [ ] Touch targets have `accessibilityRole` / `accessibilityLabel`
- [ ] Typecheck + lint clean, and tried on Android and web
