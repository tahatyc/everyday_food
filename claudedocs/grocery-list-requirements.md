# Week-Scoped Grocery Lists — Requirements Specification

**Generated**: February 11, 2026
**Status**: Ready for Design & Implementation
**Related**: [meal-plan.tsx](../app/(tabs)/meal-plan.tsx), [grocery-list.tsx](../app/grocery-list.tsx), [shoppingLists.ts](../convex/shoppingLists.ts)

---

## Problem Statement

The grocery list is currently a single global bucket with no date awareness. Changing weeks in the meal planner has no effect on the grocery list, making the feature confusing and not useful for weekly shopping.

## Core Concept

**Each week in the meal planner gets its own grocery list.** The grocery list becomes a week-scoped companion to the meal plan, not a standalone feature.

---

## Functional Requirements

### FR-1: Week-Scoped Lists
- Each grocery list is tied to a specific week (start date — end date)
- When the user taps "Grocery List" on the meal plan, it opens/creates the list **for that specific week**
- Navigating to a different week and tapping the button shows a **different** list
- Lists persist indefinitely — old weeks' lists remain accessible by navigating back to that week

### FR-2: List Generation
- **First tap** for a week: Auto-generate list from all recipes in that week's meal plan
- **Subsequent taps**: Show the existing list as-is (preserving manual edits, checked items)
- Duplicate recipe ingredients across days are **combined into a single entry** with summed quantities

### FR-3: Meal Plan Change Detection
- If the user modifies the meal plan after a grocery list was generated (adds/removes recipes), the system should detect the change
- When opening a stale grocery list, show a prompt: **"Your meal plan has changed. Update grocery list?"**
- User can accept (re-sync list with current meal plan) or dismiss (keep list as-is)
- Detection logic: compare recipe IDs in the current meal plan vs recipe IDs tracked in `shoppingListRecipes`

### FR-4: Two View Tabs
- **AISLE view** (default): Items grouped by store aisle (Produce, Dairy, Meat, Bakery, Pantry, Other)
- **RECIPE view**: Same items grouped by recipe name. Manual items appear under an "Other Items" group
- Both views share the same underlying data — just different groupings

### FR-5: Manual Items
- Users can add manual (non-recipe) items to any week's list
- Manual items and recipe items live together in the same list
- Recipe items show a source badge (recipe name); manual items show no badge
- Manual items appear in the appropriate aisle group in AISLE view, and under "Other Items" in RECIPE view

### FR-6: List Lifecycle
- Checked items remain visible (visually muted) until the user manually clears them
- A "Clear Checked" action removes all checked items at once
- Lists are never auto-archived or auto-deleted — they stay forever

### FR-7: Access Point
- Grocery list is accessed **only** from the meal plan screen (not from a separate tab or standalone screen)
- The button subtitle should reflect the week: e.g., "View items for Feb 9 - 15"

### FR-8: Week Indicator on Meal Plan
- The meal plan screen should show a visual indicator when a grocery list already exists for the currently viewed week
- Example: the grocery list button could show a badge/dot, or the subtitle changes from "Generate list for this week" to "View list for this week (12 items)"

---

## Non-Functional Requirements

| NFR | Requirement |
|-----|-------------|
| **Data model** | `shoppingLists` table needs `weekStartDate` / `weekEndDate` fields to scope lists to weeks |
| **Lookup** | New index on `shoppingLists`: `by_user_and_week` for fast week-based lookups |
| **Backward compat** | Existing global shopping list data should be preserved (treat as legacy unscoped list) |
| **Performance** | List generation should handle a full week of recipes (up to 21 meals) without noticeable delay |
| **Persistence** | Lists persist indefinitely, no auto-cleanup |

---

## Schema Changes

### `shoppingLists` table — add fields:
```
+ weekStartDate: v.optional(v.string())   // "YYYY-MM-DD" format
+ weekEndDate: v.optional(v.string())     // "YYYY-MM-DD" format
```

### New index:
```
by_user_and_week: ["userId", "weekStartDate"]
```

### No changes needed to:
- `shoppingItems` (already has recipeId for source tracking)
- `shoppingListRecipes` (already tracks which recipes were added)
- `mealPlans` (already supports getByDateRange)

---

## Backend API Changes

### New/Modified Queries

| Function | Type | Description |
|----------|------|-------------|
| `shoppingLists.getByWeek` | query | Get shopping list for a specific week (by userId + weekStartDate) |
| `shoppingLists.weekListExists` | query | Quick check if a list exists for a given week (for the indicator) |
| `shoppingLists.getActive` | query | **Modify**: keep working for backward compat with legacy lists |

### New/Modified Mutations

| Function | Type | Description |
|----------|------|-------------|
| `shoppingLists.createForWeek` | mutation | Create a new week-scoped list and populate from meal plan recipes |
| `shoppingLists.syncWithMealPlan` | mutation | Re-sync an existing list when meal plan changes are detected |
| `shoppingLists.addRecipeIngredients` | mutation | **Modify**: accept optional weekStartDate to target the correct list |

---

## Frontend Changes

### `app/(tabs)/meal-plan.tsx`
- Pass `weekStartDate` and `weekEndDate` when navigating to grocery list
- Query `weekListExists` to show indicator badge on the grocery list button
- Update button subtitle based on whether a list exists

### `app/grocery-list.tsx`
- Accept week date params (via route params or navigation state)
- Fetch list using `getByWeek` instead of `getActive`
- Implement RECIPE tab view (group items by `recipeId`/recipe name)
- Add meal plan change detection and sync prompt
- Show week date range in the header (e.g., "GROCERY LIST — Feb 9-15")

---

## User Stories

| # | Story | Acceptance Criteria |
|---|-------|-------------------|
| 1 | As a user, I tap "Grocery List" for a week with planned meals | A grocery list is generated with all ingredients from that week's recipes, grouped by aisle |
| 2 | As a user, I navigate to a different week and tap "Grocery List" | I see a different list (or empty state if no list exists yet for that week) |
| 3 | As a user, I switch to the RECIPE tab | I see the same items grouped by recipe name instead of aisle |
| 4 | As a user, I manually add "Paper towels" to the list | It appears alongside recipe items in AISLE view, and under "Other Items" in RECIPE view |
| 5 | As a user, I check off items while shopping | Checked items stay visible but are visually muted. I can "Clear Checked" when done |
| 6 | As a user, I return to a previous week | My old grocery list is still there with my checked/unchecked state preserved |
| 7 | As a user, I tap "Grocery List" for a week with no meals | I see an empty list with the option to add manual items |
| 8 | As a user, I remove a recipe from the meal plan after generating a grocery list | Next time I open the grocery list, I see a prompt asking if I want to update it |
| 9 | As a user, I see the meal plan screen | The grocery list button shows whether a list already exists for this week |

---

## Recommended Next Steps

1. **`/sc:design`** — Design schema migration, backend mutations, component architecture
2. **`/sc:implement`** — Build: schema → backend → frontend
