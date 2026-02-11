# Everyday Food - Technical Design Document

**Date**: February 2026
**Source**: [business-panel-analysis.md](business-panel-analysis.md)
**Status**: Draft - Awaiting Approval

---

## Table of Contents

1. [Feature 1: Edit Profile](#feature-1-edit-profile)
2. [Feature 2: App Settings](#feature-2-app-settings)
3. [Feature 3: Calendar Navigation](#feature-3-calendar-navigation)
4. [Feature 4: Recipe Filters](#feature-4-recipe-filters)
5. [Feature 5: Notifications (Phase 1)](#feature-5-notifications-phase-1)
6. [Shared Infrastructure](#shared-infrastructure)
7. [Schema Changes Summary](#schema-changes-summary)

---

## Feature 1: Edit Profile

**Priority**: P1 - CRITICAL | **Effort**: LOW | **Backend Ready**: YES

### Problem

The "EDIT PROFILE" button in [profile.tsx:137-144](app/(tabs)/profile.tsx#L137-L144) has no `onPress` handler. The `updateProfile` mutation in [users.ts:85-112](convex/users.ts#L85-L112) already accepts `name`, `email`, `imageUrl`, `defaultServings`, `preferredUnits`, and `dietaryPreferences`.

### Design

**Approach**: New route `/edit-profile` — a dedicated form screen. Inline editing was considered but a dedicated screen offers better form validation, a cleaner undo/cancel flow, and easier extensibility.

#### New File: `app/edit-profile.tsx`

```
Route:     /edit-profile
Type:      Modal (presentation: "modal" in _layout.tsx)
Nav:       Header with "Cancel" (left) and "Save" (right) buttons
```

#### Screen Layout

```
┌─────────────────────────────────┐
│  ← CANCEL    EDIT PROFILE  SAVE │  ← Header
├─────────────────────────────────┤
│                                 │
│         [👨‍🍳 Avatar]            │  ← Pressable, Phase 2 for image picker
│       "Change Photo" link       │
│                                 │
│  ┌─ DISPLAY NAME ────────────┐  │
│  │  [Text Input]             │  │  ← Pre-filled from user.name
│  └───────────────────────────┘  │
│                                 │
│  ┌─ BIO ─────────────────────┐  │
│  │  [Multiline Text Input]   │  │  ← Optional, new field (see schema)
│  └───────────────────────────┘  │
│                                 │
│  ┌─ DIETARY PREFERENCES ─────┐  │
│  │  [Vegetarian] [Vegan]     │  │  ← Multi-select chip group
│  │  [Gluten-Free] [Keto]    │  │
│  │  [Dairy-Free] [Nut-Free] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─ DEFAULT SERVINGS ────────┐  │
│  │  [ - ]    4    [ + ]      │  │  ← Stepper (1-12 range)
│  └───────────────────────────┘  │
│                                 │
│  ┌─ PREFERRED UNITS ─────────┐  │
│  │  [METRIC]  [IMPERIAL]     │  │  ← Toggle / segmented control
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### Data Flow

```
1. Screen mounts → useQuery(api.users.current) → pre-fill form state
2. User edits fields → local useState for each field
3. User taps "SAVE" → useMutation(api.users.updateProfile) with changed fields only
4. On success → router.back()
5. On cancel → router.back() (no save)
```

#### State Management

```tsx
// Local component state — no Zustand needed
const [name, setName] = useState(user?.name || "");
const [bio, setBio] = useState(user?.bio || "");
const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
  user?.dietaryPreferences || []
);
const [defaultServings, setDefaultServings] = useState(user?.defaultServings || 4);
const [preferredUnits, setPreferredUnits] = useState(user?.preferredUnits || "imperial");
```

#### Wiring in Profile Screen

```tsx
// profile.tsx — Add onPress to Edit Profile button
<Pressable
  style={({ pressed }) => [styles.editProfileButton, pressed && styles.cardPressed]}
  onPress={() => router.push("/edit-profile")}
>
```

#### Schema Change

Add optional `bio` field to users table:

```ts
// convex/schema.ts — users table
bio: v.optional(v.string()),
```

Update `updateProfile` mutation args to include `bio`:

```ts
// convex/users.ts — updateProfile args
bio: v.optional(v.string()),
```

#### Dietary Preferences Constants

Create a shared constants file for reuse between Edit Profile and Settings:

```
File: src/constants/dietary.ts

DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Keto",
  "Dairy-Free", "Nut-Free", "Halal", "Kosher",
  "Paleo", "Low-Carb"
]
```

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/edit-profile.tsx` | CREATE | Edit profile form screen |
| `src/constants/dietary.ts` | CREATE | Shared dietary preference constants |
| `app/(tabs)/profile.tsx` | MODIFY | Add `onPress` to Edit Profile button |
| `convex/schema.ts` | MODIFY | Add `bio` field to users table |
| `convex/users.ts` | MODIFY | Add `bio` to updateProfile mutation args |

#### Styling

- Use existing `componentStyles.input` for text inputs
- Multi-select chips: Use existing `FilterChip` pattern from [recipes.tsx:134-153](app/(tabs)/recipes.tsx#L134-L153)
- Stepper: Custom component with `IconButton` for +/- controls
- Segmented control: Two-chip toggle (reuse FilterChip pattern)
- All neo-brutalist: 3px borders, offset shadows, bold typography

---

## Feature 2: App Settings

**Priority**: P1 - HIGH | **Effort**: LOW-MEDIUM | **Backend Ready**: PARTIAL

### Problem

The "APP SETTINGS" button in [profile.tsx:223-240](app/(tabs)/profile.tsx#L223-L240) has no `onPress` handler. The settings icon in the header (line 110-112) is also non-functional.

### Design

**Approach**: New route `/settings` — a dedicated settings screen with grouped sections.

#### New File: `app/settings.tsx`

```
Route:     /settings
Type:      Stack screen (push navigation)
Nav:       Header with back arrow and "SETTINGS" title
```

#### Screen Layout

```
┌─────────────────────────────────┐
│  ←      APP SETTINGS            │  ← Header
├─────────────────────────────────┤
│                                 │
│  ── COOKING PREFERENCES ──────  │
│  ┌───────────────────────────┐  │
│  │ Default Servings     [4]  │  │  ← Stepper
│  │ Preferred Units [Imperial]│  │  ← Toggle
│  │ Week Starts On    [Monday]│  │  ← Picker (Mon/Sun)
│  └───────────────────────────┘  │
│                                 │
│  ── DIETARY PROFILE ──────────  │
│  ┌───────────────────────────┐  │
│  │ [Vegetarian] [Vegan]      │  │  ← Multi-select chips
│  │ [Gluten-Free] [Keto]     │  │    (same as Edit Profile)
│  │ [Dairy-Free] [Nut-Free]  │  │
│  └───────────────────────────┘  │
│                                 │
│  ── DATA & ACCOUNT ───────────  │
│  ┌───────────────────────────┐  │
│  │ Clear Cooking History   > │  │  ← Confirmation dialog
│  │ Export My Recipes       > │  │  ← Future / Phase 2
│  │ Delete Account          > │  │  ← Danger zone, confirmation
│  └───────────────────────────┘  │
│                                 │
│  ── ABOUT ────────────────────  │
│  ┌───────────────────────────┐  │
│  │ Version            1.0.0  │  │
│  │ Send Feedback           > │  │  ← Opens email/link
│  │ Terms of Service        > │  │  ← WebBrowser link
│  │ Privacy Policy          > │  │  ← WebBrowser link
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### Data Flow

```
1. Screen mounts → useQuery(api.users.current) → populate current values
2. Each setting change → immediate save via useMutation(api.users.updateProfile)
   (no "Save" button — settings save individually on change)
3. Dangerous actions (clear data, delete account) → Alert.alert confirmation first
```

#### Schema Changes

Add `weekStartDay` to users table:

```ts
// convex/schema.ts — users table
weekStartDay: v.optional(v.union(v.literal("monday"), v.literal("sunday"))),
```

Add `weekStartDay` to `updateProfile` mutation args.

#### Overlap with Edit Profile

Per the business analysis (Drucker's advice), keep distinct concerns:
- **Edit Profile** = identity (name, bio, avatar)
- **Settings** = behavior (units, servings, dietary, week start)

Both screens share `dietaryPreferences`, `defaultServings`, and `preferredUnits`. Changes in one reflect in the other since both use the same `updateProfile` mutation and `users.current` query.

#### Wiring in Profile Screen

```tsx
// profile.tsx — Both settings buttons navigate to /settings

// Header settings icon (line 110-112)
<Pressable style={styles.headerButton} onPress={() => router.push("/settings")}>

// APP SETTINGS card (line 223-240)
<Pressable ... onPress={() => router.push("/settings")}>
```

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/settings.tsx` | CREATE | Settings screen |
| `app/(tabs)/profile.tsx` | MODIFY | Wire both settings buttons |
| `convex/schema.ts` | MODIFY | Add `weekStartDay` to users |
| `convex/users.ts` | MODIFY | Add `weekStartDay` to updateProfile args |

#### Settings Row Component

Build a reusable `SettingsRow` inline component:

```tsx
function SettingsRow({ icon, label, value, onPress, danger }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.text} />
      <Text style={[styles.settingsLabel, danger && { color: colors.error }]}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}
```

---

## Feature 3: Calendar Navigation

**Priority**: P1 - HIGH | **Effort**: LOW | **Backend Ready**: YES

### Problem

The calendar icon in [meal-plan.tsx:453-455](app/(tabs)/meal-plan.tsx#L453-L455) has no `onPress` handler. `generateWeekDays()` (lines 47-64) only generates 7 days forward from today. Users cannot navigate to past or future weeks.

### Design

**Approach**: Two-phase implementation.
- **Phase A (MVP)**: Week navigation arrows (prev/next week) — replaces the non-functional back arrow
- **Phase B**: Date picker modal on calendar icon tap

#### Phase A: Week Navigation

Replace the current static `generateWeekDays()` with a state-driven week offset:

```tsx
// New state
const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week

// Updated generateWeekDays to accept an offset
const generateWeekDays = (offset: number = 0) => {
  const days = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + (offset * 7));

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const isToday = date.toDateString() === today.toDateString();
    days.push({
      id: i.toString(),
      dayName: DAY_NAMES[date.getDay()],
      dayNumber: date.getDate(),
      dateStr: date.toISOString().split("T")[0],
      isToday,
      month: MONTH_NAMES[date.getMonth()],
    });
  }
  return days;
};
```

#### Updated Header

```
┌─────────────────────────────────┐
│  ◀      FEB 9 - FEB 15   📅    │
│  prev      week label    picker │
└─────────────────────────────────┘
```

Replace the back arrow with a previous week arrow. Replace the calendar icon with a date picker trigger (Phase B) or "today" button:

```tsx
// Header
<Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
  {/* Previous week */}
  <Pressable style={styles.headerButton} onPress={() => setWeekOffset(w => w - 1)}>
    <Ionicons name="chevron-back" size={24} color={colors.text} />
  </Pressable>

  {/* Week label — tap to return to current week */}
  <Pressable onPress={() => setWeekOffset(0)}>
    <Text style={styles.headerTitle}>{weekLabel}</Text>
    {weekOffset !== 0 && (
      <Text style={styles.todayHint}>TAP FOR TODAY</Text>
    )}
  </Pressable>

  {/* Next week */}
  <Pressable style={styles.headerButton} onPress={() => setWeekOffset(w => w + 1)}>
    <Ionicons name="chevron-forward" size={24} color={colors.text} />
  </Pressable>
</Animated.View>
```

#### Week Label Computation

```tsx
const weekLabel = useMemo(() => {
  const days = weekDays;
  if (!days.length) return "";
  const first = days[0];
  const last = days[days.length - 1];
  return `${first.month} ${first.dayNumber} - ${last.month} ${last.dayNumber}`;
}, [weekDays]);
```

#### Reset Selected Day on Week Change

```tsx
useEffect(() => {
  // When week changes, select the first day (or today if current week)
  if (weekOffset === 0) {
    setSelectedDayIndex(0); // today
  } else {
    setSelectedDayIndex(0); // first day of the new week
  }
}, [weekOffset]);
```

#### Phase B: Date Picker (Follow-up)

Add a calendar icon that opens `@react-native-community/datetimepicker` or a custom date picker modal. Tapping a date sets `weekOffset` to the week containing that date. This is a follow-up enhancement — Phase A alone resolves the trust issue.

#### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(tabs)/meal-plan.tsx` | MODIFY | Add weekOffset state, update generateWeekDays, update header |

#### No Backend Changes

The existing `getByDate` and `getByDateRange` queries already accept arbitrary date strings. No backend changes needed.

---

## Feature 4: Recipe Filters

**Priority**: P2 - MEDIUM-HIGH | **Effort**: MEDIUM | **Backend Ready**: PARTIAL

### Problem

The filter icon in [recipes.tsx:246-252](app/(tabs)/recipes.tsx#L246-L252) shows an `Alert.alert` dialog saying "Use the category chips below." The existing chips only cover source (All, My Recipes, Global) and meal type (Breakfast, Lunch, Dinner). No filtering by cook time, difficulty, cuisine, or dietary tags.

### Design

**Approach**: Replace the Alert with a bottom sheet modal containing advanced filter options. Keep the existing chips as quick-access filters.

#### Filter Bottom Sheet

```
┌─────────────────────────────────┐
│  ═══ (drag handle) ═══         │
│                                 │
│  FILTER RECIPES          RESET  │
│                                 │
│  ── COOK TIME ──────────────── │
│  [< 15 min] [< 30 min]         │
│  [< 60 min] [Any]              │
│                                 │
│  ── DIFFICULTY ─────────────── │
│  [Easy] [Medium] [Hard]        │
│                                 │
│  ── CUISINE ────────────────── │
│  [Italian] [Mexican] [Asian]   │
│  [Mediterranean] [American]    │
│  [Indian] [Other]              │
│                                 │
│  ── DIETARY ────────────────── │
│  [Vegetarian] [Vegan]          │
│  [Gluten-Free] [Keto]         │
│                                 │
│  ┌───────────────────────────┐  │
│  │     APPLY FILTERS (12)    │  │  ← Shows result count
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### Filter State

```tsx
type RecipeFilters = {
  maxCookTime: number | null;     // null = any
  difficulty: ("easy" | "medium" | "hard")[];  // multi-select
  cuisine: string[];              // multi-select
  dietary: string[];              // multi-select from tags
};

const [filters, setFilters] = useState<RecipeFilters>({
  maxCookTime: null,
  difficulty: [],
  cuisine: [],
  dietary: [],
});
const [showFilterSheet, setShowFilterSheet] = useState(false);
```

#### Filter Application (Client-Side)

Since the `recipes.list` query returns all recipe data including `prepTime`, `cookTime`, `difficulty`, `cuisine`, and tags, filtering can be done client-side without backend changes:

```tsx
const applyAdvancedFilters = (recipes: ConvexRecipe[]): ConvexRecipe[] => {
  return recipes.filter((recipe) => {
    // Cook time filter
    if (filters.maxCookTime !== null) {
      const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
      if (totalTime > filters.maxCookTime) return false;
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      if (!recipe.difficulty || !filters.difficulty.includes(recipe.difficulty)) return false;
    }

    // Cuisine filter
    if (filters.cuisine.length > 0) {
      if (!recipe.cuisine || !filters.cuisine.includes(recipe.cuisine.toLowerCase())) return false;
    }

    // Dietary filter (from tags)
    if (filters.dietary.length > 0) {
      const recipeTags = recipe.tags?.map(t => t.toLowerCase()) || [];
      if (!filters.dietary.some(d => recipeTags.includes(d.toLowerCase()))) return false;
    }

    return true;
  });
};
```

#### Active Filter Badge

Show a badge on the filter icon when filters are active:

```tsx
const activeFilterCount =
  (filters.maxCookTime !== null ? 1 : 0) +
  filters.difficulty.length +
  filters.cuisine.length +
  filters.dietary.length;

// In the header
<View>
  <IconButton icon="options-outline" onPress={() => setShowFilterSheet(true)} />
  {activeFilterCount > 0 && (
    <View style={styles.filterBadge}>
      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
    </View>
  )}
</View>
```

#### Modal Implementation

Use React Native's `Modal` component (same pattern as [ShareRecipeModal.tsx](src/components/ShareRecipeModal.tsx)) with a slide-up animation:

```tsx
<Modal
  visible={showFilterSheet}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowFilterSheet(false)}
>
  <View style={styles.filterOverlay}>
    <Animated.View style={styles.filterSheet} entering={FadeInDown}>
      {/* Filter content */}
    </Animated.View>
  </View>
</Modal>
```

#### Cuisine Options Discovery

To populate cuisine chips dynamically, extract unique cuisines from loaded recipes:

```tsx
const availableCuisines = useMemo(() => {
  if (!allRecipes) return [];
  const cuisines = new Set<string>();
  allRecipes.forEach((r: any) => {
    if (r.cuisine) cuisines.add(r.cuisine);
  });
  return Array.from(cuisines).sort();
}, [allRecipes]);
```

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(tabs)/recipes.tsx` | MODIFY | Add filter state, bottom sheet modal, apply filters |

#### No Backend Changes for MVP

All filter fields (`prepTime`, `cookTime`, `difficulty`, `cuisine`, tags) are already returned by `recipes.list`. Client-side filtering is sufficient for the current data volume. If recipe count grows significantly (1000+), a server-side filtered query can be added later.

---

## Feature 5: Notifications (Phase 1)

**Priority**: P2 - MEDIUM | **Effort**: MEDIUM | **Backend Ready**: NO

### Problem

The notification bell in [index.tsx:286-288](app/(tabs)/index.tsx#L286-L288) has no `onPress` handler and no badge. There is no notification infrastructure.

### Design — Phase 1: In-App Notification Center

Phase 1 focuses on in-app notifications only (no push notifications). This resolves the non-functional bell icon and provides a foundation for Phase 2 (push notifications).

#### Schema Addition

```ts
// convex/schema.ts — New table
notifications: defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("friend_request"),
    v.literal("friend_accepted"),
    v.literal("recipe_shared"),
    v.literal("share_link_accessed"),
    v.literal("system")
  ),
  title: v.string(),
  body: v.string(),
  // Reference to related entity
  referenceType: v.optional(v.union(
    v.literal("friendship"),
    v.literal("recipe"),
    v.literal("shareLink")
  )),
  referenceId: v.optional(v.string()),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_read", ["userId", "isRead"])
  .index("by_user_and_created", ["userId", "createdAt"]),
```

#### New Backend File: `convex/notifications.ts`

```ts
// Queries
list       — Get user's notifications (paginated, ordered by createdAt desc)
getUnread  — Get unread count for badge

// Mutations
markAsRead    — Mark single notification as read
markAllRead   — Mark all as read
create        — Internal helper (called by other mutations)
```

#### Notification Triggers

Add notification creation calls to existing mutations:

| Trigger | In File | Notification |
|---------|---------|--------------|
| Friend request sent | `convex/friends.ts` → `sendRequest` | "**[Name]** sent you a friend request" |
| Friend request accepted | `convex/friends.ts` → `acceptRequest` | "**[Name]** accepted your friend request" |
| Recipe shared | `convex/recipeShares.ts` → `share` | "**[Name]** shared **[Recipe]** with you" |
| Share link accessed | `convex/public.ts` → `recordShareLinkAccess` | "Someone viewed your shared **[Recipe]**" |

#### Notification Center Screen

```
Route:     /notifications
Type:      Stack screen (push navigation)
```

```
┌─────────────────────────────────┐
│  ←     NOTIFICATIONS   Mark All │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ 👤 Sarah sent you a       │  │  ← Unread (bold, blue dot)
│  │    friend request          │  │
│  │                  2 min ago │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🍝 Mike shared "Pasta     │  │  ← Read (dimmed)
│  │    Carbonara" with you     │  │
│  │                  1 hr ago  │  │
│  └───────────────────────────┘  │
│                                 │
│  ── EARLIER ─────────────────  │
│  ┌───────────────────────────┐  │
│  │ 🔗 Someone viewed your    │  │
│  │    shared recipe           │  │
│  │               Yesterday   │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### Badge on Bell Icon

```tsx
// index.tsx — Notification bell with unread count
const unreadCount = useQuery(api.notifications.getUnread);

<Pressable style={styles.notificationButton} onPress={() => router.push("/notifications")}>
  <Ionicons name="notifications-outline" size={24} color={colors.text} />
  {unreadCount > 0 && (
    <View style={styles.notificationBadge}>
      <Text style={styles.notificationBadgeText}>
        {unreadCount > 9 ? "9+" : unreadCount}
      </Text>
    </View>
  )}
</Pressable>
```

#### Notification Tap Actions

| Type | Tap Action |
|------|------------|
| `friend_request` | Navigate to `/friends` |
| `friend_accepted` | Navigate to `/friends` |
| `recipe_shared` | Navigate to `/recipe/[referenceId]` |
| `share_link_accessed` | Navigate to `/recipe/[referenceId]` |
| `system` | No navigation |

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `convex/schema.ts` | MODIFY | Add `notifications` table |
| `convex/notifications.ts` | CREATE | Notification queries and mutations |
| `app/notifications.tsx` | CREATE | Notification center screen |
| `app/(tabs)/index.tsx` | MODIFY | Wire bell icon, add badge |
| `convex/friends.ts` | MODIFY | Add notification triggers to `sendRequest`, `acceptRequest` |
| `convex/recipeShares.ts` | MODIFY | Add notification trigger to `share` |
| `convex/public.ts` | MODIFY | Add notification trigger to `recordShareLinkAccess` |

---

## Shared Infrastructure

### New Shared Constants

```
File: src/constants/dietary.ts

export const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Keto",
  "Dairy-Free", "Nut-Free", "Halal", "Kosher",
  "Paleo", "Low-Carb",
];

export const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Asian", "Mediterranean",
  "American", "Indian", "French", "Japanese",
  "Thai", "Chinese", "Greek", "Middle Eastern",
];

export const COOK_TIME_OPTIONS = [
  { label: "< 15 min", value: 15 },
  { label: "< 30 min", value: 30 },
  { label: "< 60 min", value: 60 },
  { label: "Any", value: null },
];
```

### Reusable Multi-Select Chip Group

Both Edit Profile and Recipe Filters need a multi-select chip group. Build it inline where used (no shared component yet — only create a shared component if a third usage appears).

Pattern:

```tsx
function ChipGroup({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <View style={styles.chipGroup}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.chip, selected.includes(option) && styles.chipSelected]}
          onPress={() => onToggle(option)}
        >
          <Text style={[styles.chipText, selected.includes(option) && styles.chipTextSelected]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

---

## Schema Changes Summary

All changes to `convex/schema.ts`:

```ts
// 1. users table additions
bio: v.optional(v.string()),                           // Feature 1: Edit Profile
weekStartDay: v.optional(                              // Feature 2: App Settings
  v.union(v.literal("monday"), v.literal("sunday"))
),

// 2. New notifications table                          // Feature 5: Notifications
notifications: defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("friend_request"),
    v.literal("friend_accepted"),
    v.literal("recipe_shared"),
    v.literal("share_link_accessed"),
    v.literal("system")
  ),
  title: v.string(),
  body: v.string(),
  referenceType: v.optional(v.union(
    v.literal("friendship"),
    v.literal("recipe"),
    v.literal("shareLink")
  )),
  referenceId: v.optional(v.string()),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_read", ["userId", "isRead"])
  .index("by_user_and_created", ["userId", "createdAt"]),
```

### `convex/users.ts` — `updateProfile` additions

```ts
// New args
bio: v.optional(v.string()),
weekStartDay: v.optional(v.union(v.literal("monday"), v.literal("sunday"))),
```

---

## Implementation Order

| # | Feature | Files | Est. Scope | Dependencies |
|---|---------|-------|------------|--------------|
| 1 | Edit Profile | 5 files (2 create, 3 modify) | Small | Schema change (bio) |
| 2 | App Settings | 4 files (1 create, 3 modify) | Small | Schema change (weekStartDay) |
| 3 | Calendar Navigation | 1 file (modify) | Small | None |
| 4 | Recipe Filters | 1 file (modify) | Medium | None |
| 5 | Notifications Phase 1 | 7 files (2 create, 5 modify) | Medium-Large | Schema change (notifications table) |

**Recommended**: Implement Features 1-3 first (all LOW effort, immediate trust repair), then Feature 4, then Feature 5.

Schema changes for Features 1 and 2 can be batched in a single deployment. Feature 5 schema change should be its own deployment.

---

## Out of Scope

- Push notifications (Phase 2-3 — requires `expo-notifications` setup)
- Image upload for avatar (Phase 2 — requires Convex storage integration)
- Dark mode theme (future — requires theme context provider)
- Export recipes feature (future — requires file generation)
- Delete account (future — requires cascade deletion logic)
- Server-side recipe filtering (only needed at 1000+ recipes)

---

*Technical Design generated for Everyday Food*
*Source: [business-panel-analysis.md](business-panel-analysis.md)*
