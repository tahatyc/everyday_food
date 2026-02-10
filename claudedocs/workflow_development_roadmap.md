# Everyday Food - Development Workflow & Roadmap

**Generated**: February 9, 2026
**Source**: [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md)
**Strategy**: Systematic — prioritized by effort, impact, and dependency chain

---

## Overview

5 features across 3 phases, targeting 18 files (6 create, 12 modify). Schema changes are batched to minimize Convex deployments.

```
Phase 1 (P1 - Quick Wins)     ███████░░░  Features 1-3   ~3 days
Phase 2 (P2 - Core UX)        █████░░░░░  Feature 4      ~2 days
Phase 3 (P2 - Infrastructure)  ████████░░  Feature 5      ~3 days
                                                    Total: ~8 days
```

---

## Phase 1: Quick Wins (P1 - Critical/High, Low Effort)

> Goal: Fix all non-functional buttons. Immediate trust repair.

### Step 1.0 — Schema & Backend Batch Deploy

**Checkpoint**: Backend changes for Features 1 & 2 deployed together.

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 1.0.1 | Add `bio` field to users table | `convex/schema.ts` | MODIFY | `bio: v.optional(v.string())` |
| 1.0.2 | Add `weekStartDay` field to users table | `convex/schema.ts` | MODIFY | `weekStartDay: v.optional(v.union(v.literal("monday"), v.literal("sunday")))` |
| 1.0.3 | Add `bio` to updateProfile mutation args | `convex/users.ts` | MODIFY | Add `bio: v.optional(v.string())` to args and patch object |
| 1.0.4 | Add `weekStartDay` to updateProfile mutation args | `convex/users.ts` | MODIFY | Add `weekStartDay` to args and patch object |

**Validation Gate**:
- [ ] Run `npx convex dev` — schema deploys without errors
- [ ] Verify fields appear in Convex dashboard

---

### Step 1.1 — Feature 1: Edit Profile

**Depends on**: Step 1.0 (schema deployed)

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 1.1.1 | Create dietary constants file | `src/constants/dietary.ts` | CREATE | `DIETARY_OPTIONS`, `CUISINE_OPTIONS`, `COOK_TIME_OPTIONS` arrays |
| 1.1.2 | Create Edit Profile screen | `app/edit-profile.tsx` | CREATE | Modal screen with form: name, bio, dietary chips, servings stepper, units toggle |
| 1.1.3 | Wire Edit Profile button | `app/(tabs)/profile.tsx` | MODIFY | Add `onPress={() => router.push("/edit-profile")}` to Edit Profile button |
| 1.1.4 | Register modal route in layout | `app/_layout.tsx` | MODIFY | Add `<Stack.Screen name="edit-profile" options={{ presentation: "modal" }}>` if needed |

**Implementation Notes**:
- Pre-fill form from `useQuery(api.users.current)`
- Local `useState` for each field — no Zustand
- Save only changed fields via `useMutation(api.users.updateProfile)`
- Cancel = `router.back()` with no save
- Dietary chips: reuse `FilterChip` pattern from `recipes.tsx:134-153`
- Stepper: `IconButton` for +/- with 1-12 range
- Units toggle: two-chip segmented control

**Validation Gate**:
- [ ] Edit Profile button navigates to modal
- [ ] Form pre-fills with current user data
- [ ] Save persists changes (verify in Convex dashboard)
- [ ] Cancel discards changes
- [ ] Run `npm test` — all tests pass

---

### Step 1.2 — Feature 2: App Settings

**Depends on**: Step 1.0 (schema deployed), Step 1.1 (shares dietary constants)

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 1.2.1 | Create Settings screen | `app/settings.tsx` | CREATE | Stack screen with grouped sections: Cooking, Dietary, Data, About |
| 1.2.2 | Wire both settings buttons | `app/(tabs)/profile.tsx` | MODIFY | Header gear icon + APP SETTINGS card → `router.push("/settings")` |
| 1.2.3 | Register stack route in layout | `app/_layout.tsx` | MODIFY | Add `<Stack.Screen name="settings">` if needed |

**Implementation Notes**:
- Immediate save per setting change (no Save button)
- `SettingsRow` inline component for consistent row rendering
- Week start day: two-option picker (Monday/Sunday)
- Dangerous actions (Clear History, Delete Account): `Alert.alert` confirmation
- "Export My Recipes" and "Delete Account" show "Coming Soon" toast
- About section: version from `app.json`, feedback/legal links via `Linking.openURL`
- Reuse `DIETARY_OPTIONS` from `src/constants/dietary.ts`

**Validation Gate**:
- [ ] Both settings entry points navigate to Settings screen
- [ ] Settings persist on change (no Save button needed)
- [ ] Changes in Settings reflect in Edit Profile and vice versa
- [ ] Dangerous action confirmations work
- [ ] Run `npm test` — all tests pass

---

### Step 1.3 — Feature 3: Calendar Navigation

**Depends on**: None (fully independent)

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 1.3.1 | Add `weekOffset` state and update `generateWeekDays` | `app/(tabs)/meal-plan.tsx` | MODIFY | State-driven week generation with offset parameter |
| 1.3.2 | Replace header with week navigation | `app/(tabs)/meal-plan.tsx` | MODIFY | Prev/Next arrows, week label (e.g., "FEB 9 - FEB 15"), tap to return to today |
| 1.3.3 | Reset selected day on week change | `app/(tabs)/meal-plan.tsx` | MODIFY | `useEffect` on `weekOffset` to reset `selectedDayIndex` |

**Implementation Notes**:
- `weekOffset` state: 0 = current week, -1 = previous, +1 = next
- Week label: `useMemo` computing "MMM D - MMM D" from first/last day
- "TAP FOR TODAY" hint text when `weekOffset !== 0`
- No backend changes — existing `getByDate`/`getByDateRange` accept any date strings
- No new dependencies needed

**Validation Gate**:
- [ ] Left arrow navigates to previous week
- [ ] Right arrow navigates to next week
- [ ] Week label shows correct date range
- [ ] Tapping week label returns to current week
- [ ] Meal plans load correctly for navigated weeks
- [ ] Run `npm test` — all tests pass

---

### Phase 1 Completion Checkpoint

- [ ] All 3 non-functional buttons now work (Edit Profile, Settings, Calendar)
- [ ] Schema changes deployed (`bio`, `weekStartDay`)
- [ ] No test regressions — `npm test` passes
- [ ] Manual smoke test on web/device

---

## Phase 2: Core UX Enhancement (P2 - Medium-High, Medium Effort)

> Goal: Advanced recipe discovery with filtering.

### Step 2.1 — Feature 4: Recipe Filters

**Depends on**: Step 1.1 (dietary constants file created)

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 2.1.1 | Add filter state to recipes screen | `app/(tabs)/recipes.tsx` | MODIFY | `RecipeFilters` type + `useState` for filters and sheet visibility |
| 2.1.2 | Build filter bottom sheet modal | `app/(tabs)/recipes.tsx` | MODIFY | `Modal` with slide-up animation, filter sections: cook time, difficulty, cuisine, dietary |
| 2.1.3 | Implement client-side filter logic | `app/(tabs)/recipes.tsx` | MODIFY | `applyAdvancedFilters()` function filtering on time, difficulty, cuisine, dietary tags |
| 2.1.4 | Add active filter badge to icon | `app/(tabs)/recipes.tsx` | MODIFY | Badge overlay on filter icon showing active filter count |
| 2.1.5 | Add reset filters functionality | `app/(tabs)/recipes.tsx` | MODIFY | "RESET" button in sheet header clears all filters |
| 2.1.6 | Show result count on Apply button | `app/(tabs)/recipes.tsx` | MODIFY | "APPLY FILTERS (N)" showing filtered count |

**Implementation Notes**:
- Replace `Alert.alert` on filter icon with `setShowFilterSheet(true)`
- Cook time chips: `< 15 min`, `< 30 min`, `< 60 min`, `Any` (single select)
- Difficulty: `Easy`, `Medium`, `Hard` (multi-select)
- Cuisine: dynamically extracted from loaded recipes via `useMemo`, fallback to `CUISINE_OPTIONS`
- Dietary: from `DIETARY_OPTIONS` constant (multi-select)
- All filtering is client-side — no backend changes
- Reuse `Modal` pattern from `ShareRecipeModal.tsx`

**Validation Gate**:
- [ ] Filter icon opens bottom sheet (no more Alert)
- [ ] Each filter section works (cook time, difficulty, cuisine, dietary)
- [ ] Active filter badge shows correct count
- [ ] Reset clears all filters
- [ ] Apply button shows correct result count
- [ ] Filters persist while navigating within recipes tab
- [ ] Run `npm test` — all tests pass

---

### Phase 2 Completion Checkpoint

- [ ] Recipe filtering fully functional
- [ ] No test regressions — `npm test` passes
- [ ] Manual testing with various filter combinations

---

## Phase 3: Notification Infrastructure (P2 - Medium, Medium-Large Effort)

> Goal: In-app notification system. Foundation for future push notifications.

### Step 3.0 — Schema & Backend for Notifications

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 3.0.1 | Add `notifications` table to schema | `convex/schema.ts` | MODIFY | Full table with `userId`, `type`, `title`, `body`, `referenceType`, `referenceId`, `isRead`, `createdAt` + 3 indexes |
| 3.0.2 | Create notifications backend | `convex/notifications.ts` | CREATE | Queries: `list` (paginated), `getUnread` (count). Mutations: `markAsRead`, `markAllRead`, `create` (internal helper) |

**Validation Gate**:
- [ ] Run `npx convex dev` — notifications table deploys
- [ ] Queries and mutations accessible via Convex dashboard

---

### Step 3.1 — Notification Triggers

**Depends on**: Step 3.0

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 3.1.1 | Add notification on friend request | `convex/friends.ts` | MODIFY | In `sendRequest`: create notification for target user |
| 3.1.2 | Add notification on friend accept | `convex/friends.ts` | MODIFY | In `acceptRequest`: create notification for requester |
| 3.1.3 | Add notification on recipe share | `convex/recipeShares.ts` | MODIFY | In `share`: create notification for recipient |
| 3.1.4 | Add notification on share link access | `convex/public.ts` | MODIFY | In `recordShareLinkAccess`: create notification for link owner |

**Validation Gate**:
- [ ] Each trigger creates a notification (verify in Convex dashboard)
- [ ] Notification has correct type, title, body, and references

---

### Step 3.2 — Notification Center UI

**Depends on**: Step 3.0

| # | Task | File | Action | Details |
|---|------|------|--------|---------|
| 3.2.1 | Create Notification Center screen | `app/notifications.tsx` | CREATE | Stack screen showing notification list with read/unread states, time ago, grouped by recency |
| 3.2.2 | Wire bell icon with badge | `app/(tabs)/index.tsx` | MODIFY | Add `onPress` to bell → `router.push("/notifications")`, add unread count badge |
| 3.2.3 | Register route in layout | `app/_layout.tsx` | MODIFY | Add `<Stack.Screen name="notifications">` if needed |

**Implementation Notes**:
- Notification list: FlatList with pull-to-refresh
- Unread indicators: bold text + colored dot
- Time formatting: `date-fns` `formatDistanceToNow`
- "Mark All Read" button in header
- Tap actions by type:
  - `friend_request` / `friend_accepted` → `/friends`
  - `recipe_shared` / `share_link_accessed` → `/recipe/[referenceId]`
  - `system` → no navigation
- Mark as read on tap
- Group by "Recent" / "Earlier" (today vs. older)

**Validation Gate**:
- [ ] Bell icon shows unread badge count
- [ ] Tapping bell navigates to Notification Center
- [ ] Notifications display with correct content and formatting
- [ ] Tap on notification marks as read and navigates correctly
- [ ] "Mark All Read" works
- [ ] Run `npm test` — all tests pass

---

### Phase 3 Completion Checkpoint

- [ ] Full notification flow: trigger → store → display → interact
- [ ] No test regressions — `npm test` passes
- [ ] Manual end-to-end test: send friend request → notification appears → tap navigates

---

## Dependency Graph

```
Step 1.0 (Schema Batch)
  ├── Step 1.1 (Edit Profile)
  │     └── Step 2.1 (Recipe Filters) — shares dietary constants
  ├── Step 1.2 (App Settings) — shares dietary constants with 1.1
  └── (independent)

Step 1.3 (Calendar Nav) — fully independent, can run in parallel with 1.0-1.2

Step 3.0 (Notification Schema)
  ├── Step 3.1 (Triggers)
  └── Step 3.2 (UI)
```

**Parallelization Opportunities**:
- Steps 1.1 + 1.3 can be developed in parallel (no shared files)
- Steps 3.1 + 3.2 can be developed in parallel after 3.0

---

## File Impact Matrix

| File | Steps Touching It | Total Edits |
|------|-------------------|-------------|
| `convex/schema.ts` | 1.0.1, 1.0.2, 3.0.1 | 3 |
| `convex/users.ts` | 1.0.3, 1.0.4 | 2 |
| `app/(tabs)/profile.tsx` | 1.1.3, 1.2.2 | 2 |
| `app/(tabs)/recipes.tsx` | 2.1.1-2.1.6 | 6 (single feature) |
| `app/(tabs)/meal-plan.tsx` | 1.3.1-1.3.3 | 3 (single feature) |
| `app/(tabs)/index.tsx` | 3.2.2 | 1 |
| `app/_layout.tsx` | 1.1.4, 1.2.3, 3.2.3 | 3 |
| `convex/friends.ts` | 3.1.1, 3.1.2 | 2 |
| `convex/recipeShares.ts` | 3.1.3 | 1 |
| `convex/public.ts` | 3.1.4 | 1 |

**New Files (6)**:
| File | Step | Type |
|------|------|------|
| `src/constants/dietary.ts` | 1.1.1 | Constants |
| `app/edit-profile.tsx` | 1.1.2 | Screen |
| `app/settings.tsx` | 1.2.1 | Screen |
| `convex/notifications.ts` | 3.0.2 | Backend |
| `app/notifications.tsx` | 3.2.1 | Screen |

---

## Testing Strategy

| Phase | Unit Tests | Manual Tests |
|-------|-----------|--------------|
| Phase 1 | Update `profile.test.tsx` (button navigation), add `edit-profile.test.tsx`, add `settings.test.tsx`, update `meal-plan.test.tsx` (week navigation) | Verify form save/cancel, settings persistence, week navigation |
| Phase 2 | Update `recipes.test.tsx` (filter state, filter logic, modal open/close) | Test filter combinations, reset, badge count |
| Phase 3 | Add `notifications.test.tsx`, verify trigger creation in backend tests | End-to-end: trigger → badge → list → tap → navigate |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema migration breaks existing data | Low | High | Fields are all `v.optional` — no breaking changes |
| Filter performance with large recipe sets | Low (current) | Medium | Client-side OK for <1000 recipes; server-side query ready as fallback |
| Notification volume overwhelming users | Low | Medium | Phase 1 has limited triggers; add mute/preferences in Phase 2 |
| Conflicting edits between Edit Profile and Settings | Low | Low | Both use same mutation + query — Convex handles consistency |

---

## Execution Checklist

- [ ] **Phase 1, Step 1.0**: Schema + backend batch deploy
- [ ] **Phase 1, Step 1.1**: Edit Profile screen
- [ ] **Phase 1, Step 1.2**: App Settings screen
- [ ] **Phase 1, Step 1.3**: Calendar Navigation
- [ ] **Phase 1 Checkpoint**: All quick wins verified
- [ ] **Phase 2, Step 2.1**: Recipe Filters
- [ ] **Phase 2 Checkpoint**: Filtering verified
- [ ] **Phase 3, Step 3.0**: Notification schema + backend
- [ ] **Phase 3, Step 3.1**: Notification triggers
- [ ] **Phase 3, Step 3.2**: Notification Center UI
- [ ] **Phase 3 Checkpoint**: Full notification flow verified
- [ ] **Final**: `npm test` passes, `npm run test:coverage` meets thresholds

---

## Next Step

Run `/sc:implement` to begin execution starting with **Phase 1, Step 1.0 (Schema & Backend Batch Deploy)**.

---

*Workflow generated from [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md)*
