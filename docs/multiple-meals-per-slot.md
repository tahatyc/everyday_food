# Multiple Meals Per Slot — Requirements Specification

## Feature Overview

Allow users to plan up to **3 meals per meal type** (breakfast, lunch, dinner) per day,
replacing the current hard 1-per-slot constraint.

---

## Current State

### Core Constraint (Backend)

The `addMeal` mutation in [convex/mealPlans.ts](../convex/mealPlans.ts) uses the
`by_user_date_meal` index to find an existing entry and **patches it** (replace behavior).
This enforces one meal per slot in code — not in the schema.

### Core Constraint (Frontend)

`getMealPlan()` in [app/(tabs)/meal-plan.tsx](../app/(tabs)/meal-plan.tsx) keeps only the
last match per meal type. `MealSection` is built around a single-recipe-per-slot model.

### Key Finding

**No schema change is required.** The `mealPlans` table already supports multiple rows
with the same `(userId, date, mealType)`. Only the mutation logic and UI need to change.

---

## Functional Requirements

### FR-1: Multiple Meal Cards (Vertical Stack)

- Each meal type section (BREAKFAST / LUNCH / DINNER) renders a **vertical list of meal cards**
- Each card retains its individual `[CHANGE]` and `[trash]` actions
- When the section has **0 meals**: shows the existing dashed "Add a meal" empty card (current behavior preserved)
- When the section has **1–2 meals**: shows all cards + a **"+ ADD ANOTHER [MEAL TYPE]"** button beneath them
- When the section has **3 meals** (cap reached): the "Add another" button is hidden

### FR-2: Cap at 3 Meals Per Slot

- Frontend enforces: hide the "+ ADD ANOTHER" button when `meals.length >= 3`
- Backend enforces: `addMeal` mutation rejects inserts that would exceed 3 entries for
  `(userId, date, mealType)` — throws a user-facing error
- The cap applies per meal type per day (breakfast, lunch, dinner are independent)

### FR-3: Combined Nutrition Total in Section Header

- Section header label changes from `"BREAKFAST"` to `"BREAKFAST — 500 KCAL"` when ≥1 meal
  has calorie data
- Total is the **sum of `nutritionPerServing.calories`** across all meals in that slot
- If no meal has calorie data, the label remains just `"BREAKFAST"` (no "0 KCAL")

### FR-4: Backend `addMeal` — Always Insert (No Replace)

- The current replace-on-match behavior is **removed**
- `addMeal` always inserts a new row (subject to the cap of 3)
- The "CHANGE" action patches an existing record by its `mealPlanId` directly

### FR-5: "CHANGE" Action Updates Specific Card

- The `onChangeMeal` handler must target a specific `mealPlanId`, not the whole slot
- It selects a random recipe and patches that specific record

### FR-6: "ADD" Action via Recipe Picker

- Tapping "Add a meal" (empty state) or "+ ADD ANOTHER" navigates to `/select-recipe`
  with `{ date, mealType }` — same as today
- On returning from picker, the selected recipe is **inserted as a new entry** (not replacing)

### FR-7: Random Plan Generation — Still 1 Per Slot

- `handleGenerateRandomPlan` behavior is **unchanged**: adds 1 recipe per meal type
- If a slot already has meals, it inserts an additional one (unless cap is reached — skip silently)
- No removal of existing meals

---

## Non-Functional Requirements

### NFR-1: No Breaking Changes to Other Features

| Feature | Impact |
|---|---|
| Grocery list | None — aggregates ingredients across all recipe IDs in the week automatically |
| Shopping list `addRecipeIngredients` | None — already recipe-level |
| Cook mode | None — navigates by `recipe._id` |

### NFR-2: Performance

`getByDate` already fetches all records for `(userId, date)`. Returning multiple rows per
meal type costs no extra DB round-trips — only slightly more in-memory work.

### NFR-3: Backwards Compatibility

Existing single-meal data remains valid. A user with 1 breakfast still sees exactly 1 card.

---

## Data Model Impact

**No schema change required.**

The `by_user_date_meal` index is repurposed for the **cap check** — count rows matching
`(userId, date, mealType)` before inserting, reject if count ≥ 3.

---

## UI Change Summary

| Location | Current | New |
|---|---|---|
| `MealSection` props | `recipe: ConvexRecipe \| null` | `meals: Array<{ recipe, mealPlanId }>` |
| `MealSection` render | Single card or empty card | List of cards + conditional "Add another" button |
| Section header label | `"BREAKFAST"` | `"BREAKFAST"` or `"BREAKFAST — 500 KCAL"` |
| `getMealPlan()` return type | `{ recipe, mealPlanId }` per slot | `{ meals: Array<{ recipe, mealPlanId }> }` per slot |
| `handleChangeMeal` | Finds recipe by mealType | Patches by `mealPlanId` (targets specific card) |
| `addMeal` backend | Replace-on-match | Always insert + cap check |

---

## UI Mockup

```
┌─ BREAKFAST — 500 KCAL ─────────────────────┐
│ 🍳 Omelette              320 KCAL           │
│                   [CHANGE] [🗑]             │
├────────────────────────────────────────────┤
│ 🥐 Croissant             180 KCAL           │
│                   [CHANGE] [🗑]             │
└────────────────────────────────────────────┘
         [+ ADD ANOTHER BREAKFAST]

┌─ LUNCH ────────────────────────────────────┐
│            + Add a meal                    │  ← empty state (dashed)
└────────────────────────────────────────────┘
```

---

## Open Questions

- Should the "CHANGE" button on individual cards still pick a **random** recipe, or navigate
  to the recipe picker? *(Current behavior = random swap)*
- Should `snack` be surfaced in the UI as a 4th section? *(Exists in schema/backend,
  hidden in current screen)*
