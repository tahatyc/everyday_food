# Multiple Meals Per Slot — Implementation Design Plan

> **Source spec:** [multiple-meals-per-slot.md](./multiple-meals-per-slot.md)
> **Status:** Ready for implementation
> **Affected files:** `convex/mealPlans.ts`, `app/(tabs)/meal-plan.tsx`
> **Schema changes:** None required

---

## 1. Summary of Changes

| Layer | File | Change Type |
|---|---|---|
| Backend | `convex/mealPlans.ts` | Modify `addMeal` + add `changeMeal` mutation |
| Frontend | `app/(tabs)/meal-plan.tsx` | Refactor types, `getMealPlan()`, `MealSection`, handlers |

---

## 2. Backend Design — `convex/mealPlans.ts`

### 2.1 Modify `addMeal` — Remove Replace, Add Cap Check

**Current behavior (lines 132–146):**
```ts
const existing = await ctx.db.query("mealPlans")
  .withIndex("by_user_date_meal", ...)
  .first();

if (existing) {
  await ctx.db.patch(existing._id, { recipeId, servings });  // ← REPLACE
  return existing._id;
}
```

**New behavior:**
```ts
// Cap check — count existing rows for (userId, date, mealType)
const existing = await ctx.db.query("mealPlans")
  .withIndex("by_user_date_meal", (q) =>
    q.eq("userId", userId).eq("date", args.date).eq("mealType", args.mealType)
  )
  .collect();

if (existing.length >= 3) {
  throw new Error(`You can only add up to 3 ${args.mealType} meals per day.`);
}

// Always insert new row
const mealPlanId = await ctx.db.insert("mealPlans", {
  userId,
  date: args.date,
  mealType: args.mealType,
  recipeId: args.recipeId,
  servings: args.servings,
  createdAt: Date.now(),
});

return mealPlanId;
```

**Key points:**
- `.first()` → `.collect()` to count all existing entries for the slot
- Remove the `if (existing) { patch }` block entirely
- Throw a user-facing error string (the frontend catches it and calls `showError()`)
- Cap is 3; the index `by_user_date_meal` is reused — no new index needed

---

### 2.2 Add `changeMeal` Mutation — Patch by `mealPlanId`

The "CHANGE" button on a card must update **one specific** meal plan row, not the slot. A dedicated mutation makes this explicit and avoids misuse of `addMeal`.

```ts
export const changeMeal = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    recipeId: v.id("recipes"),
    servings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const hasAccess = await canAccessMealPlan(ctx, args.mealPlanId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to modify this meal plan entry.");
    }

    await ctx.db.patch(args.mealPlanId, {
      recipeId: args.recipeId,
      servings: args.servings,
    });

    return args.mealPlanId;
  },
});
```

**Why a separate mutation instead of reusing `addMeal`?**
- `addMeal` now *always inserts*; allowing it to patch would re-introduce the replace bug
- `changeMeal` has a narrower, unambiguous purpose and can enforce ownership cleanly
- The frontend handler `handleChangeMeal` maps 1:1 to this new mutation

---

### 2.3 `removeMeal` — Unchanged

No changes required. Already accepts a `mealPlanId` and deletes the specific row.

---

### 2.4 `getByDate` — Unchanged

Already returns **all** rows for `(userId, date)`. When the frontend previously only kept the last match per meal type, that was a client-side reduction. Removing it is purely a frontend concern.

---

## 3. Frontend Design — `app/(tabs)/meal-plan.tsx`

### 3.1 New Type Definitions

Replace the single-recipe slot type with an array-based slot type:

```ts
// Existing type (unchanged)
type ConvexRecipe = {
  _id: Id<"recipes">;
  title: string;
  prepTime?: number;
  cookTime?: number;
  nutritionPerServing?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
};

// New: a single entry in a meal slot
type MealEntry = {
  recipe: ConvexRecipe;
  mealPlanId: Id<"mealPlans">;
};

// New: the shape returned by getMealPlan()
type DayMealPlan = {
  breakfast: MealEntry[];
  lunch: MealEntry[];
  dinner: MealEntry[];
};
```

---

### 3.2 Refactor `getMealPlan()` — Return Arrays

**Current** (lines 294–318): iterates `mealPlansData`, overwrites per-slot value on every match (keeps only last).

**New:** collects all matching rows per slot into arrays.

```ts
const getMealPlan = (): DayMealPlan => {
  const plan: DayMealPlan = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  if (!mealPlansData) return plan;

  for (const meal of mealPlansData) {
    if (!meal.recipe) continue;
    const entry: MealEntry = {
      recipe: meal.recipe as ConvexRecipe,
      mealPlanId: meal._id,
    };
    if (meal.mealType === "breakfast") plan.breakfast.push(entry);
    else if (meal.mealType === "lunch") plan.lunch.push(entry);
    else if (meal.mealType === "dinner") plan.dinner.push(entry);
  }

  return plan;
};
```

---

### 3.3 Refactor `MealSection` Props

**Current props:**
```ts
{
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  recipe: ConvexRecipe | null;
  mealPlanId: Id<"mealPlans"> | null;
  index: number;
  onChangeMeal: () => void;
  onAddMeal: () => void;
  onRemoveMeal: () => void;
}
```

**New props:**
```ts
{
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  meals: MealEntry[];                                    // replaces recipe + mealPlanId
  index: number;
  onChangeMeal: (mealPlanId: Id<"mealPlans">) => void;  // now ID-specific
  onAddMeal: () => void;
  onRemoveMeal: (mealPlanId: Id<"mealPlans">) => void;  // now ID-specific
}
```

---

### 3.4 `MealSection` Render Logic

```
meals.length === 0  →  render EmptyMealCard (dashed, "Add a meal")
meals.length 1–2    →  render MealCards[] + "ADD ANOTHER" button
meals.length === 3  →  render MealCards[], "ADD ANOTHER" button hidden
```

**Section header label:**
```ts
const totalCalories = meals.reduce(
  (sum, entry) => sum + (entry.recipe.nutritionPerServing?.calories ?? 0),
  0
);
const hasCalorieData = meals.some(e => e.recipe.nutritionPerServing?.calories);
const headerLabel = hasCalorieData
  ? `${label} — ${totalCalories} KCAL`
  : label;
```

**Card list:**
```tsx
{meals.map((entry, i) => (
  <MealCard
    key={entry.mealPlanId}
    entry={entry}
    mealType={type}
    onChangeMeal={() => onChangeMeal(entry.mealPlanId)}
    onRemoveMeal={() => onRemoveMeal(entry.mealPlanId)}
  />
))}
```

Extract the existing card JSX into a local `MealCard` sub-component to keep `MealSection` readable. This is a refactor within the same file — no new file needed.

**"Add another" button:**
```tsx
{meals.length > 0 && meals.length < 3 && (
  <Pressable
    style={({ pressed }) => [styles.addAnotherButton, pressed && styles.buttonPressed]}
    onPress={onAddMeal}
  >
    <Ionicons name="add" size={16} color={colors.text} />
    <Text style={styles.addAnotherButtonText}>
      + ADD ANOTHER {label}
    </Text>
  </Pressable>
)}
```

**Empty state (unchanged visual):**
```tsx
{meals.length === 0 && (
  <Pressable
    style={({ pressed }) => [styles.mealCard, styles.emptyMealCard, pressed && styles.cardPressed]}
    onPress={onAddMeal}
  >
    <View style={styles.emptyMealContent}>
      <Ionicons name="add" size={24} color={colors.textMuted} />
      <Text style={styles.emptyMealText}>Add a meal</Text>
    </View>
  </Pressable>
)}
```

---

### 3.5 Handler: `handleChangeMeal`

**Current** (lines 343–371): finds the current recipe for `mealType`, picks a random replacement, calls `addMealMutation` (which patches due to the replace logic — that logic is being removed).

**New:** accepts a `mealPlanId`, picks random replacement, calls new `changeMealMutation`.

```ts
const changeMealMutation = useMutation(api.mealPlans.changeMeal);

const handleChangeMeal = async (
  mealType: "breakfast" | "lunch" | "dinner",
  mealPlanId: Id<"mealPlans">
) => {
  if (!allRecipes || allRecipes.length === 0) return;

  // Get all recipeIds currently in this slot to exclude them
  const currentIds = new Set(
    mealPlan[mealType].map((e) => e.recipe._id)
  );

  const matchingRecipes = allRecipes.filter(
    (r: any) =>
      r.tags?.some((t: string) => t.toLowerCase() === mealType) &&
      !currentIds.has(r._id)
  );

  if (matchingRecipes.length === 0) return;

  const randomRecipe =
    matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];

  try {
    await changeMealMutation({
      mealPlanId,
      recipeId: randomRecipe._id,
    });
  } catch (error) {
    showError("Failed to update meal.");
  }
};
```

**Design notes:**
- Excludes *all* recipes currently in the slot (not just the one being changed), giving more variety
- Uses `changeMealMutation` (patch) instead of `addMealMutation` (insert)

---

### 3.6 Handler: `handleAddMeal` — Unchanged

Navigation to `/select-recipe` with `{ date, mealType }` params is unchanged. The `select-recipe` screen calls `addMeal` which now inserts a new row.

---

### 3.7 Handler: `handleRemoveMeal`

**Current** (lines 325–332): signature `handleRemoveMeal(mealPlanId)` — already correct.

**New:** same signature, but now called from individual cards rather than a single slot-level prop. No logic change needed; just update the call site in the `MealSection` props.

---

### 3.8 Handler: `handleGenerateRandomPlan` — Unchanged Logic

The existing logic already calls `addMealMutation` once per meal type. With the new backend:
- If slot has 0–2 meals → inserts 1 more (correct)
- If slot already has 3 meals → `addMeal` throws; the frontend should catch silently

Update the try-catch to swallow cap errors gracefully:
```ts
try {
  if (randomBreakfast) await addMealMutation({ ... });
} catch {
  // Cap reached for this slot — skip silently
}
// same for lunch and dinner
```

---

### 3.9 Updated `MealSection` Call Sites

```tsx
<MealSection
  type="breakfast"
  label="BREAKFAST"
  meals={mealPlan.breakfast}           // was: recipe={...}, mealPlanId={...}
  index={0}
  onChangeMeal={(id) => handleChangeMeal("breakfast", id)}
  onAddMeal={() => handleAddMeal("breakfast")}
  onRemoveMeal={(id) => handleRemoveMeal(id)}
/>
// repeat for lunch (index 1) and dinner (index 2)
```

---

### 3.10 New Styles Required

```ts
addAnotherButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface,
  borderWidth: borders.regular,
  borderColor: borders.color,
  borderStyle: "dashed",
  borderRadius: borderRadius.md,
  paddingVertical: spacing.md,
  marginTop: spacing.sm,
  gap: spacing.xs,
  ...shadows.xs,
},
addAnotherButtonText: {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.text,
  letterSpacing: typography.letterSpacing.wide,
},
```

---

## 4. Data Flow

### Adding a Second Meal to Breakfast

```
User taps "+ ADD ANOTHER BREAKFAST"
  │
  ▼
handleAddMeal("breakfast")
  │
  ▼
router.push("/select-recipe", { date, mealType: "breakfast" })
  │
  ▼
User selects recipe in picker → calls addMealMutation({ date, "breakfast", recipeId })
  │
  ▼
[Backend] addMeal mutation
  ├─ Counts existing rows for (userId, date, "breakfast")
  ├─ If count >= 3 → throws error
  └─ Else → ctx.db.insert(...) → returns new mealPlanId
  │
  ▼
[Frontend] getByDate reactive query re-runs
  │
  ▼
getMealPlan() → breakfast: [entry1, entry2]
  │
  ▼
MealSection re-renders: 2 cards + "+ ADD ANOTHER BREAKFAST" button
```

### Changing a Specific Meal Card

```
User taps [CHANGE] on card with mealPlanId = "abc123"
  │
  ▼
onChangeMeal("abc123")  →  handleChangeMeal("breakfast", "abc123")
  │
  ▼
Picks random recipe (excludes all current slot recipes)
  │
  ▼
changeMealMutation({ mealPlanId: "abc123", recipeId: newId })
  │
  ▼
[Backend] canAccessMealPlan check → ctx.db.patch("abc123", { recipeId: newId })
  │
  ▼
getByDate reactive query re-runs → MealSection re-renders with updated card
```

---

## 5. Component Hierarchy (after refactor)

```
MealPlanScreen
  ├─ Header (week navigation)
  ├─ DaySelector (unchanged)
  └─ ScrollView
       ├─ MealSection [breakfast]
       │    ├─ SectionLabel ("BREAKFAST — 500 KCAL")
       │    ├─ MealCard [entry 1]  ← extracted local component
       │    ├─ MealCard [entry 2]
       │    └─ AddAnotherButton (hidden at cap 3)
       ├─ MealSection [lunch]
       │    └─ EmptyMealCard (dashed, 0 entries)
       ├─ MealSection [dinner]
       │    └─ MealCard [entry 1]
       ├─ GenerateRandomPlanButton
       └─ GroceryListLink
```

---

## 6. Testing Plan

### Unit Test Updates — `__tests__/meal-plan.test.tsx`

| Test Case | Action |
|---|---|
| Renders empty state for slot with 0 meals | Verify dashed card + "Add a meal" text |
| Renders 1 card + "Add another" button for 1 meal | Check button text matches meal type |
| Renders 2 cards + "Add another" button for 2 meals | Check 2 cards render |
| Hides "Add another" when 3 meals in slot | Button must not be in output |
| Section header shows KCAL total when meals have calorie data | Sum = correct value |
| Section header shows no KCAL when no calorie data | Label = plain "BREAKFAST" |
| `handleChangeMeal` calls `changeMealMutation` with correct `mealPlanId` | Mock mutation, verify args |
| `handleGenerateRandomPlan` silently skips capped slots | No error toast shown |

### Backend Test Updates (if applicable)

| Test Case | Expected |
|---|---|
| `addMeal` with 0 existing entries | Inserts new row, returns id |
| `addMeal` with 2 existing entries | Inserts new row (total = 3) |
| `addMeal` with 3 existing entries | Throws cap error |
| `changeMeal` with valid `mealPlanId` | Patches recipeId |
| `changeMeal` with wrong user's `mealPlanId` | Throws auth error |

---

## 7. Edge Cases & Mitigations

| Edge Case | Handling |
|---|---|
| Two taps of "+ ADD ANOTHER" before first resolves | Backend cap check prevents duplicate inserts; second request throws and shows error toast |
| `allRecipes` empty when CHANGE tapped | `handleChangeMeal` returns early (no mutation called) |
| All matching recipes already in slot | `matchingRecipes.length === 0` → early return, no change |
| Random plan generation on a full slot | `addMeal` throws; caught silently in `handleGenerateRandomPlan` |
| Recipe deleted after being added to slot | `getByDate` handler skips rows where `recipe === null` (existing behavior at line 47) — slot shrinks naturally |

---

## 8. Non-Goals (out of scope for this implementation)

- Surfacing the `snack` type as a 4th visible section (open question in spec)
- Changing CHANGE button to navigate to recipe picker instead of random swap (open question in spec)
- Ordering / drag-to-reorder meal cards within a slot
- Per-meal serving count editing from the meal plan screen

---

## 9. Implementation Order

1. **Backend first** — modify `addMeal` + add `changeMeal` in `convex/mealPlans.ts`
2. **Types** — add `MealEntry` and `DayMealPlan` types in `meal-plan.tsx`
3. **`getMealPlan()`** — refactor to return arrays
4. **`MealSection`** — update props interface and render logic (extract `MealCard`)
5. **Handlers** — update `handleChangeMeal`, update call sites, fix `handleGenerateRandomPlan` catch
6. **Styles** — add `addAnotherButton` and `addAnotherButtonText`
7. **Tests** — update `meal-plan.test.tsx` with new cases
8. **Run `npm test`** — ensure coverage thresholds pass
