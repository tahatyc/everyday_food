# Week-Scoped Grocery Lists — Design & Implementation Plan

**Created**: February 11, 2026
**Source**: [grocery-list-requirements.md](grocery-list-requirements.md)
**Status**: Pending Approval

---

## Overview

Transform the grocery list from a single global bucket into a **week-scoped companion** to the meal plan. Each week gets its own grocery list, auto-generated from that week's recipes, with change detection and dual view modes (Aisle/Recipe).

---

## Phase 1: Schema Changes

### File: `convex/schema.ts`

**Modify `shoppingLists` table** — add two optional fields for week scoping:

```ts
shoppingLists: defineTable({
  userId: v.id("users"),
  name: v.string(),
  isActive: v.optional(v.boolean()),
  weekStartDate: v.optional(v.string()),  // NEW — "YYYY-MM-DD"
  weekEndDate: v.optional(v.string()),    // NEW — "YYYY-MM-DD"
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_and_active", ["userId", "isActive"])
  .index("by_user_and_week", ["userId", "weekStartDate"])  // NEW
```

**Why optional?** Preserves backward compatibility with existing global lists that have no week association. New lists will always have both fields set.

**No changes needed to:**
- `shoppingItems` — already has `recipeId` for source tracking
- `shoppingListRecipes` — already tracks which recipes contributed
- `mealPlans` — already supports `getByDateRange`

---

## Phase 2: Backend API Changes

### File: `convex/shoppingLists.ts`

#### 2.1 New Query: `getByWeek`

Fetches the shopping list for a specific week. Returns the list with all items and recipe names, or `null` if none exists.

```
Args: { weekStartDate: string }
Logic:
  1. Get userId
  2. Query shoppingLists with index by_user_and_week (userId + weekStartDate)
  3. If found, fetch all shoppingItems for the list
  4. For each item with recipeId, resolve recipe title
  5. Return list + items (same shape as existing getActive)
```

#### 2.2 New Query: `weekListExists`

Lightweight check for the meal plan screen badge indicator.

```
Args: { weekStartDate: string }
Logic:
  1. Get userId
  2. Query shoppingLists with index by_user_and_week
  3. If list found, count items via shoppingItems by_list index
  4. Return { exists: boolean, itemCount: number }
```

#### 2.3 New Mutation: `createForWeek`

Creates a new week-scoped list and populates it from the week's meal plan.

```
Args: { weekStartDate: string, weekEndDate: string }
Logic:
  1. Get userId
  2. Check if list already exists for this week (guard against duplicates)
  3. Fetch meal plans for date range via mealPlans by_user index + filter
  4. Collect unique recipeIds from meal plans
  5. Insert new shoppingLists row with weekStartDate + weekEndDate
  6. For each recipe:
     a. Fetch ingredients (skip optional)
     b. Combine duplicates: if same ingredient name across recipes, sum amounts
     c. Insert shoppingItems with recipeId, aisle (reuse existing getAisle logic)
     d. Track in shoppingListRecipes
  7. Return the new list ID
```

**Ingredient combining logic:**
- Key on lowercase ingredient name
- If same name appears across multiple recipes, combine into one shoppingItem with summed amount
- Store `originalItems` array for traceability (already in schema)
- Use first occurrence's unit; if units differ, keep separate entries

#### 2.4 New Mutation: `syncWithMealPlan`

Re-syncs a stale grocery list when meal plan changes are detected.

```
Args: { listId: Id<"shoppingLists"> }
Logic:
  1. Get userId, verify access
  2. Get the list's weekStartDate/weekEndDate
  3. Fetch current meal plan recipes for that date range
  4. Fetch current shoppingListRecipes for this list
  5. Diff: find added recipes and removed recipes
  6. For removed recipes: delete their shoppingItems (where recipeId matches)
     and remove from shoppingListRecipes
  7. For added recipes: fetch ingredients, combine duplicates, insert new
     shoppingItems and shoppingListRecipes entries
  8. Preserve: manual items (no recipeId), checked state on existing items
  9. Update list's updatedAt timestamp
```

#### 2.5 New Query: `detectMealPlanChanges`

Compares current meal plan recipes vs tracked recipes in the shopping list.

```
Args: { listId: Id<"shoppingLists"> }
Logic:
  1. Get the list's weekStartDate/weekEndDate
  2. Fetch current meal plan recipeIds for that date range
  3. Fetch shoppingListRecipes recipeIds for this list
  4. Compare the two sets
  5. Return { hasChanges: boolean, addedRecipes: string[], removedRecipes: string[] }
```

#### 2.6 Modify: `getActive` (backward compat)

Keep the existing `getActive` query working as-is. It queries by `isActive: true` which won't conflict with week-scoped lists (week-scoped lists won't set `isActive`).

#### 2.7 Modify: `addItem`

Add optional `listId` parameter so manual items can be added to a specific week list (not just the active global list).

```
Args: { ..., listId: v.optional(v.id("shoppingLists")) }
Logic:
  - If listId provided, use that list directly
  - Otherwise, fall back to current behavior (get/create active list)
```

#### 2.8 Modify: `clearChecked`

No changes needed — already accepts `listId` param and works on any list.

---

## Phase 3: Frontend — Meal Plan Screen

### File: `app/(tabs)/meal-plan.tsx`

#### 3.1 Week Indicator Badge

Add a query to check if a grocery list exists for the current week:

```tsx
const weekListInfo = useQuery(
  api.shoppingLists.weekListExists,
  weekStartDate ? { weekStartDate } : "skip"
);
```

Update the grocery button subtitle:
- No list exists: `"Generate list for Feb 9 - 15"`
- List exists: `"View list for Feb 9 - 15 (12 items)"`

Optionally add a small dot badge on the cart icon when a list exists.

#### 3.2 Navigation with Week Params

Change `handleOpenGroceryList` to:
1. **Remove** the current logic that adds all recipe ingredients on every tap
2. **Instead**, pass `weekStartDate` and `weekEndDate` as route params:

```tsx
const handleOpenGroceryList = () => {
  router.push({
    pathname: "/grocery-list",
    params: { weekStartDate, weekEndDate },
  });
};
```

The grocery list screen itself handles list creation/fetching.

---

## Phase 4: Frontend — Grocery List Screen

### File: `app/grocery-list.tsx`

This is the largest change. The screen transforms from a simple global list viewer into a week-aware, dual-view list with change detection.

#### 4.1 Route Params

Accept week params from navigation:

```tsx
import { useLocalSearchParams } from "expo-router";

const { weekStartDate, weekEndDate } = useLocalSearchParams<{
  weekStartDate: string;
  weekEndDate: string;
}>();
```

#### 4.2 Data Fetching Strategy

```tsx
// Check if list exists for this week
const existingList = useQuery(
  api.shoppingLists.getByWeek,
  weekStartDate ? { weekStartDate } : "skip"
);

// Detect meal plan changes (only if list exists)
const changeDetection = useQuery(
  api.shoppingLists.detectMealPlanChanges,
  existingList?._id ? { listId: existingList._id } : "skip"
);

// Mutations
const createForWeek = useMutation(api.shoppingLists.createForWeek);
const syncWithMealPlan = useMutation(api.shoppingLists.syncWithMealPlan);
const addItemMutation = useMutation(api.shoppingLists.addItem);
```

#### 4.3 Auto-Create on First Visit

When user opens grocery list for a week with no existing list:

```tsx
useEffect(() => {
  if (existingList === null && weekStartDate && weekEndDate) {
    createForWeek({ weekStartDate, weekEndDate });
  }
}, [existingList, weekStartDate, weekEndDate]);
```

This auto-generates the list from that week's meal plan recipes.

#### 4.4 Meal Plan Change Detection Banner

When `changeDetection?.hasChanges` is true, show an alert banner at the top:

```
┌─────────────────────────────────────────┐
│  ⚠️  Your meal plan has changed.        │
│  [UPDATE LIST]  [DISMISS]               │
└─────────────────────────────────────────┘
```

- **UPDATE LIST** calls `syncWithMealPlan({ listId })`
- **DISMISS** hides the banner for this session (local state)

Style: neo-brutalist card with `colors.secondary` (yellow) background, bold border.

#### 4.5 Header with Week Range

Replace `"SMART GROCERY LIST"` with:

```
GROCERY LIST — FEB 9-15
```

Derived from `weekStartDate` and `weekEndDate` using date-fns `format()`.

#### 4.6 RECIPE View Tab (new)

The AISLE view already exists. Add RECIPE view grouping:

```tsx
const recipeGroupedItems = useMemo(() => {
  if (!existingList?.items) return {};

  const groups: Record<string, GroceryItem[]> = {};

  for (const item of existingList.items) {
    const groupName = item.recipeName || "Other Items";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
  }

  return groups;
}, [existingList?.items]);
```

When `activeView === "recipe"`, render `recipeGroupedItems` instead of `groupedItems`.

#### 4.7 Add Manual Item

Add an input at the bottom of the list (above checkout button) for adding manual items:

```tsx
<View style={styles.addItemRow}>
  <TextInput
    placeholder="Add an item..."
    value={newItemName}
    onChangeText={setNewItemName}
    onSubmitEditing={handleAddManualItem}
  />
  <Pressable onPress={handleAddManualItem}>
    <Ionicons name="add-circle" />
  </Pressable>
</View>
```

Calls `addItemMutation({ name, listId: existingList._id })`.

#### 4.8 Clear Checked Button

Wire up the existing `clearChecked` mutation to a button in the header menu or as a footer action. The mutation already exists and works.

---

## Phase 5: Implementation Order

Recommended step-by-step build sequence:

| Step | What | Files |
|------|------|-------|
| 1 | Schema migration (add fields + index) | `convex/schema.ts` |
| 2 | Backend: `getByWeek` query | `convex/shoppingLists.ts` |
| 3 | Backend: `weekListExists` query | `convex/shoppingLists.ts` |
| 4 | Backend: `createForWeek` mutation | `convex/shoppingLists.ts` |
| 5 | Backend: `detectMealPlanChanges` query | `convex/shoppingLists.ts` |
| 6 | Backend: `syncWithMealPlan` mutation | `convex/shoppingLists.ts` |
| 7 | Backend: modify `addItem` (optional listId) | `convex/shoppingLists.ts` |
| 8 | Frontend: meal plan button + navigation | `app/(tabs)/meal-plan.tsx` |
| 9 | Frontend: grocery list — week params + data fetching | `app/grocery-list.tsx` |
| 10 | Frontend: grocery list — auto-create + change banner | `app/grocery-list.tsx` |
| 11 | Frontend: grocery list — RECIPE view tab | `app/grocery-list.tsx` |
| 12 | Frontend: grocery list — add manual item + clear checked | `app/grocery-list.tsx` |
| 13 | Frontend: grocery list — header with week range | `app/grocery-list.tsx` |

---

## Data Flow Diagram

```
MEAL PLAN SCREEN                    GROCERY LIST SCREEN
┌──────────────────┐               ┌──────────────────────┐
│                  │  navigate     │                      │
│  [Grocery List]  │──────────────>│  weekStartDate param │
│  button          │  w/ params   │  weekEndDate param   │
│                  │               │                      │
│  weekListExists  │               │  getByWeek query     │
│  query (badge)   │               │      │               │
└──────────────────┘               │      ├── exists?     │
                                   │      │   YES: show   │
                                   │      │   NO: create  │
                                   │      │   (auto)      │
                                   │      │               │
                                   │  detectChanges query │
                                   │      │               │
                                   │      ├── changed?    │
                                   │      │   YES: banner │
                                   │      │   NO: nothing │
                                   │      │               │
                                   │  ┌───┴────────────┐  │
                                   │  │ AISLE | RECIPE │  │
                                   │  │  view toggle   │  │
                                   │  └────────────────┘  │
                                   │                      │
                                   │  [+ Add item]        │
                                   │  [Clear checked]     │
                                   └──────────────────────┘
```

---

## Edge Cases & Decisions

| Scenario | Decision |
|----------|----------|
| User opens grocery list with no meals planned | Create empty list; user can add manual items |
| Duplicate ingredients across recipes (same name, same unit) | Combine into one item, sum amounts, store `originalItems` for traceability |
| Duplicate ingredients with different units (e.g., "1 cup flour" + "2 tbsp flour") | Keep as separate items (unit conversion is out of scope) |
| User navigates to grocery list directly (no params) | Fall back to legacy `getActive` behavior for backward compat |
| List already exists for the week, user taps button again | Show existing list as-is (no re-generation) |
| User clears all items then re-opens | Show empty list (it exists but is empty) |
| Week with no meals, user adds manual items, then adds meals | Change detection triggers — user can choose to sync (adds recipe items alongside manual items) |

---

## Files Modified Summary

| File | Type of Change |
|------|---------------|
| `convex/schema.ts` | Add 2 fields + 1 index to `shoppingLists` |
| `convex/shoppingLists.ts` | Add 4 new functions, modify 1 existing |
| `app/(tabs)/meal-plan.tsx` | Update grocery button + navigation |
| `app/grocery-list.tsx` | Major rewrite — week params, dual view, change detection, add item |

---

## Next Step

After this design is approved, run `/sc:implement` to build the changes following the Phase 5 implementation order.
