# Multiple Meals Per Slot — Development Workflow

> **Design doc:** [multiple-meals-per-slot-design.md](./multiple-meals-per-slot-design.md)
> **Spec:** [multiple-meals-per-slot.md](./multiple-meals-per-slot.md)
> **Affected files:**
> - `convex/mealPlans.ts` (backend)
> - `app/(tabs)/meal-plan.tsx` (frontend)
> - `app/(tabs)/__tests__/meal-plan.test.tsx` (tests)
> **Next step after this workflow:** `/sc:implement`

---

## Dependency Map

```
Phase 1 (Backend)
  └─ must complete before Phase 2 (frontend reads new mutation name)

Phase 2 (Types + getMealPlan)
  └─ must complete before Phase 3 (MealSection depends on MealEntry[])

Phase 3 (MealSection refactor)
  └─ must complete before Phase 4 (handlers depend on new prop signatures)

Phase 4 (Handlers)
  └─ must complete before Phase 5 (call sites wire handlers to styles)

Phase 5 (Styles)
  └─ must complete before Phase 6 (tests render styled components)

Phase 6 (Tests)
  └─ must complete before Phase 7 (checkpoint: npm test)
```

---

## Phase 1 — Backend: `convex/mealPlans.ts`

### Task 1.1 — Modify `addMeal`: Remove Replace Logic, Add Cap Check

**File:** `convex/mealPlans.ts`
**Lines to change:** 132–158

**Remove** (current replace-on-match block, lines 132–146):
```ts
const existing = await ctx.db
  .query("mealPlans")
  .withIndex("by_user_date_meal", (q) =>
    q.eq("userId", userId).eq("date", args.date).eq("mealType", args.mealType)
  )
  .first();

if (existing) {
  await ctx.db.patch(existing._id, {
    recipeId: args.recipeId,
    servings: args.servings,
  });
  return existing._id;
}
```

**Replace with** (cap check + always-insert):
```ts
const existing = await ctx.db
  .query("mealPlans")
  .withIndex("by_user_date_meal", (q) =>
    q.eq("userId", userId).eq("date", args.date).eq("mealType", args.mealType)
  )
  .collect();

if (existing.length >= 3) {
  throw new Error(
    `You can only add up to 3 ${args.mealType} meals per day.`
  );
}
```

**What stays the same:** the `ctx.db.insert(...)` block below (lines 149–158) is unchanged.

**Validation:** The handler now always reaches the `insert` call. If you count existing entries and they are ≥ 3, it throws before reaching `insert`.

---

### Task 1.2 — Add `changeMeal` Mutation

**File:** `convex/mealPlans.ts`
**Insert after** the `addMeal` mutation closing brace (after line 160).

**Add:**
```ts
// Update a specific meal plan entry (change its recipe)
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

**Validation:** The mutation uses `canAccessMealPlan` (already imported from `./lib/accessControl`). No new imports needed.

---

### Checkpoint 1 — Backend Sanity

After completing Phase 1:
- `convex/mealPlans.ts` exports: `getByDate`, `getByDateRange`, `addMeal`, `changeMeal`, `removeMeal`
- `addMeal` has no `.first()` or `.patch()` calls in its handler
- `changeMeal` uses `canAccessMealPlan` for auth and `ctx.db.patch` for the update

---

## Phase 2 — Frontend Types & Data: `app/(tabs)/meal-plan.tsx`

### Task 2.1 — Add `MealEntry` and `DayMealPlan` Types

**File:** `app/(tabs)/meal-plan.tsx`
**Insert after** the existing `ConvexRecipe` type (after line 46).

**Add:**
```ts
// A single entry within a meal slot
type MealEntry = {
  recipe: ConvexRecipe;
  mealPlanId: Id<"mealPlans">;
};

// The full day plan — one array per slot
type DayMealPlan = {
  breakfast: MealEntry[];
  lunch: MealEntry[];
  dinner: MealEntry[];
};
```

**No existing code changes.** This is a pure addition.

---

### Task 2.2 — Refactor `getMealPlan()` to Return Arrays

**File:** `app/(tabs)/meal-plan.tsx`
**Lines to change:** 294–320 (the `getMealPlan` function body)

**Remove** the existing function body:
```ts
const getMealPlan = () => {
  const plan: {
    breakfast: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
    lunch: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
    dinner: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
  } = {
    breakfast: { recipe: null, mealPlanId: null },
    lunch: { recipe: null, mealPlanId: null },
    dinner: { recipe: null, mealPlanId: null },
  };

  if (mealPlansData) {
    for (const meal of mealPlansData) {
      if (meal.mealType === "breakfast" && meal.recipe) {
        plan.breakfast = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
      } else if (meal.mealType === "lunch" && meal.recipe) {
        plan.lunch = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
      } else if (meal.mealType === "dinner" && meal.recipe) {
        plan.dinner = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
      }
    }
  }

  return plan;
};
```

**Replace with:**
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

**Validation:** `mealPlan.breakfast` is now `MealEntry[]`. Any reference to `mealPlan.breakfast.recipe` will be a TypeScript error — these are fixed in Phase 3 and 4.

---

## Phase 3 — Frontend Component: `MealSection` Refactor

All changes are within `app/(tabs)/meal-plan.tsx`.

### Task 3.1 — Update `MealSection` Props Interface

**Lines to change:** 118–136 (the `MealSection` function signature and destructuring).

**Remove** current props:
```ts
function MealSection({
  type,
  label,
  recipe,
  mealPlanId,
  index,
  onChangeMeal,
  onAddMeal,
  onRemoveMeal,
}: {
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  recipe: ConvexRecipe | null;
  mealPlanId: Id<"mealPlans"> | null;
  index: number;
  onChangeMeal: () => void;
  onAddMeal: () => void;
  onRemoveMeal: () => void;
})
```

**Replace with:**
```ts
function MealSection({
  type,
  label,
  meals,
  index,
  onChangeMeal,
  onAddMeal,
  onRemoveMeal,
}: {
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  meals: MealEntry[];
  index: number;
  onChangeMeal: (mealPlanId: Id<"mealPlans">) => void;
  onAddMeal: () => void;
  onRemoveMeal: (mealPlanId: Id<"mealPlans">) => void;
})
```

---

### Task 3.2 — Extract `MealCard` Sub-component

**Insert before** the `MealSection` function (before line 118).

This extracts the existing filled-card JSX (currently inside `MealSection`) into its own component so the list-map in Task 3.3 stays clean.

```tsx
function MealCard({
  entry,
  mealType,
  onChangeMeal,
  onRemoveMeal,
}: {
  entry: MealEntry;
  mealType: "breakfast" | "lunch" | "dinner";
  onChangeMeal: () => void;
  onRemoveMeal: () => void;
}) {
  const recipeMealType =
    entry.recipe.tags?.find((t: string) =>
      ["breakfast", "lunch", "dinner", "snack"].includes(t.toLowerCase())
    )?.toLowerCase() || mealType;
  const bgColor = getMealTypeColor(recipeMealType);

  return (
    <Pressable
      style={({ pressed }) => [styles.mealCard, pressed && styles.cardPressed]}
      onPress={() => router.push(`/recipe/${entry.recipe._id}` as any)}
    >
      <View style={styles.mealImageContainer}>
        <View style={[styles.mealImage, { backgroundColor: bgColor }]}>
          <Text style={styles.mealEmoji}>
            {recipeMealType === "breakfast"
              ? "🍳"
              : recipeMealType === "lunch"
              ? "🥗"
              : recipeMealType === "snack"
              ? "🍪"
              : "🍝"}
          </Text>
        </View>
      </View>

      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle} numberOfLines={1}>
          {entry.recipe.title.toUpperCase()}
        </Text>
        <View style={styles.mealBadge}>
          <Text style={styles.mealBadgeText}>
            {entry.recipe.nutritionPerServing?.calories || 0} KCAL
          </Text>
        </View>
        <View style={styles.mealActions}>
          <Pressable
            style={({ pressed }) => [
              styles.changeButton,
              pressed && styles.changeButtonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onChangeMeal();
            }}
          >
            <Ionicons name="swap-horizontal" size={14} color={colors.textLight} />
            <Text style={styles.changeButtonText}>CHANGE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.removeButtonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onRemoveMeal();
            }}
          >
            <Ionicons name="trash-outline" size={14} color={colors.surface} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
```

**Note:** The `recipeMealType`/`bgColor` logic that was in `MealSection` is now owned by `MealCard`. The old `MealSection` declaration of these two variables (lines 137–140) must be removed in the next task.

---

### Task 3.3 — Rewrite `MealSection` Render Body

**Lines to change:** 137–232 (everything inside the `MealSection` function body, after the opening brace).

**Remove** the existing body (variables + return statement).

**Replace with:**
```tsx
  // Calorie total for section header
  const totalCalories = meals.reduce(
    (sum, entry) => sum + (entry.recipe.nutritionPerServing?.calories ?? 0),
    0
  );
  const hasCalorieData = meals.some((e) => e.recipe.nutritionPerServing?.calories);
  const headerLabel = hasCalorieData ? `${label} — ${totalCalories} KCAL` : label;

  // Background color for section label chip (use slot type when no meals)
  const bgColor = getMealTypeColor(type);

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
      style={styles.mealSection}
    >
      {/* Section Label */}
      <View style={styles.mealLabelContainer}>
        <View style={[styles.mealLabel, { backgroundColor: bgColor }]}>
          <Text style={styles.mealLabelText}>{headerLabel}</Text>
        </View>
        <View style={styles.mealLabelLine} />
      </View>

      {/* Empty state */}
      {meals.length === 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.mealCard,
            styles.emptyMealCard,
            pressed && styles.cardPressed,
          ]}
          onPress={onAddMeal}
        >
          <View style={styles.emptyMealContent}>
            <Ionicons name="add" size={24} color={colors.textMuted} />
            <Text style={styles.emptyMealText}>Add a meal</Text>
          </View>
        </Pressable>
      )}

      {/* Meal cards list */}
      {meals.map((entry) => (
        <MealCard
          key={entry.mealPlanId}
          entry={entry}
          mealType={type}
          onChangeMeal={() => onChangeMeal(entry.mealPlanId)}
          onRemoveMeal={() => onRemoveMeal(entry.mealPlanId)}
        />
      ))}

      {/* Add another button (visible at 1–2 meals, hidden at 3) */}
      {meals.length > 0 && meals.length < 3 && (
        <Pressable
          style={({ pressed }) => [
            styles.addAnotherButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onAddMeal}
        >
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={styles.addAnotherButtonText}>
            + ADD ANOTHER {label}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
```

---

### Task 3.4 — Update `MealSection` Call Sites

**Lines to change:** 534–563 (the three `<MealSection ... />` usages in the `return` block).

**Remove** the three existing `<MealSection>` calls.

**Replace with:**
```tsx
<MealSection
  type="breakfast"
  label="BREAKFAST"
  meals={mealPlan.breakfast}
  index={0}
  onChangeMeal={(id) => handleChangeMeal("breakfast", id)}
  onAddMeal={() => handleAddMeal("breakfast")}
  onRemoveMeal={(id) => handleRemoveMeal(id)}
/>
<MealSection
  type="lunch"
  label="LUNCH"
  meals={mealPlan.lunch}
  index={1}
  onChangeMeal={(id) => handleChangeMeal("lunch", id)}
  onAddMeal={() => handleAddMeal("lunch")}
  onRemoveMeal={(id) => handleRemoveMeal(id)}
/>
<MealSection
  type="dinner"
  label="DINNER"
  meals={mealPlan.dinner}
  index={2}
  onChangeMeal={(id) => handleChangeMeal("dinner", id)}
  onAddMeal={() => handleAddMeal("dinner")}
  onRemoveMeal={(id) => handleRemoveMeal(id)}
/>
```

---

## Phase 4 — Frontend Handlers: `app/(tabs)/meal-plan.tsx`

### Task 4.1 — Register `changeMealMutation` Hook

**Location:** near the existing `useMutation` calls (around lines 290–291).

**Add after** the `removeMealMutation` declaration:
```ts
const changeMealMutation = useMutation(api.mealPlans.changeMeal);
```

**Note:** `api.mealPlans.changeMeal` will only be valid after Convex regenerates its types from Phase 1. Convex hot-reloads automatically during `npx convex dev` — no manual step needed.

---

### Task 4.2 — Rewrite `handleChangeMeal`

**Lines to change:** 343–371 (existing `handleChangeMeal` function).

**Remove** the existing function.

**Replace with:**
```ts
const handleChangeMeal = async (
  mealType: "breakfast" | "lunch" | "dinner",
  mealPlanId: Id<"mealPlans">
) => {
  if (!allRecipes || allRecipes.length === 0) return;

  // Exclude all recipes already in this slot to maximize variety
  const currentIds = new Set(mealPlan[mealType].map((e) => e.recipe._id));

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

---

### Task 4.3 — Fix `handleGenerateRandomPlan` Try-Catch

**Lines to change:** 399–424 (the three try blocks inside `handleGenerateRandomPlan`).

**Current pattern** (single try wrapping all three mutations):
```ts
try {
  if (randomBreakfast) { await addMealMutation({...}); }
  if (randomLunch)     { await addMealMutation({...}); }
  if (randomDinner)    { await addMealMutation({...}); }
  showSuccess("Meal plan generated!");
} catch (error) {
  showError("Failed to generate meal plan.");
}
```

**Replace with** (individual catches so cap errors are silent):
```ts
let added = false;

if (randomBreakfast) {
  try {
    await addMealMutation({ date: selectedDate, mealType: "breakfast", recipeId: randomBreakfast._id });
    added = true;
  } catch { /* cap reached for breakfast — skip silently */ }
}
if (randomLunch) {
  try {
    await addMealMutation({ date: selectedDate, mealType: "lunch", recipeId: randomLunch._id });
    added = true;
  } catch { /* cap reached for lunch — skip silently */ }
}
if (randomDinner) {
  try {
    await addMealMutation({ date: selectedDate, mealType: "dinner", recipeId: randomDinner._id });
    added = true;
  } catch { /* cap reached for dinner — skip silently */ }
}

if (added) showSuccess("Meal plan generated!");
```

**Why `added` flag?** If all three slots are at cap, no mutation succeeds. Showing the success toast in that case would be misleading. Showing nothing (or optionally `showError`) is cleaner.

---

### Task 4.4 — `handleRemoveMeal` — No Logic Change

The existing signature `handleRemoveMeal(mealPlanId: Id<"mealPlans"> | null)` is already correct. The only change was in Task 3.4 (call sites now pass `id` from the card rather than the slot-level `mealPlanId`). No changes needed here.

---

## Phase 5 — Styles: `app/(tabs)/meal-plan.tsx`

### Task 5.1 — Add `addAnotherButton` and `addAnotherButtonText` Styles

**File:** `app/(tabs)/meal-plan.tsx`
**Location:** Inside `StyleSheet.create({...})`, after the `emptyMealContent` style (around line 753).

**Add:**
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

**Note:** `shadows.xs` is already used elsewhere in the file (`dayItem` style, line 671). It is part of the existing `neobrutalism` token set and needs no import change.

---

## Phase 6 — Tests: `app/(tabs)/__tests__/meal-plan.test.tsx`

### Task 6.1 — Update `beforeEach` Mock Order

**Current** (lines 11–17):
```ts
beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)
    .mockReturnValueOnce(mockRemoveMeal)
    .mockReturnValueOnce(mockAddRecipeIngredients);
});
```

The screen now calls `useMutation` 4 times (in order): `addMeal`, `removeMeal`, `changeMeal`, and the existing `addRecipeIngredients` from other screens. Add the mock:

**Add** at top of file after `mockRemoveMeal`:
```ts
const mockChangeMeal = jest.fn();
```

**Update `beforeEach`:**
```ts
beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)       // addMeal
    .mockReturnValueOnce(mockRemoveMeal)    // removeMeal
    .mockReturnValueOnce(mockChangeMeal)    // changeMeal (new)
    .mockReturnValueOnce(mockAddRecipeIngredients);
});
```

---

### Task 6.2 — Update `mockQueries` Helper

**Current** (lines 20–26): mocks 3 `useQuery` calls.

The screen still makes the same 3 `useQuery` calls (`getByDate`, `weekListExists`, `recipes.list`). No change needed here unless the query count changes.

**Verify:** The `weekListExists` query returns `undefined` by default (the `.mockReturnValue(undefined)` fallback handles it). Existing tests pass `[]` as `weekPlans` but the screen maps this to `weekListInfo`. This is fine — no change required.

---

### Task 6.3 — Update Existing Test: `renders meal with recipe data`

**Current** (lines 110–128): expects `'250 KCAL'` inside the card badge **and** the header to show `'BREAKFAST'`.

After the refactor, the section header will show `'BREAKFAST — 250 KCAL'` when calorie data is present. The card badge still shows `'250 KCAL'`. The old assertion `getByText('BREAKFAST')` will fail because the label is now `'BREAKFAST — 250 KCAL'`.

**Update** the test:
```ts
it('renders meal with recipe data', () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'breakfast',
      recipe: {
        _id: 'r1',
        title: 'Scrambled Eggs',
        nutritionPerServing: { calories: 250, protein: 18, carbs: 2, fat: 20 },
        tags: ['breakfast'],
      },
    },
  ];
  mockQueries(mockMealPlans);

  const { getByText } = render(<MealPlanScreen />);
  expect(getByText('SCRAMBLED EGGS')).toBeTruthy();
  expect(getByText('250 KCAL')).toBeTruthy();
  // Section header now shows calorie total
  expect(getByText('BREAKFAST — 250 KCAL')).toBeTruthy();
});
```

---

### Task 6.4 — Update Existing Test: `renders meal sections for breakfast, lunch, and dinner`

**Current** (lines 61–68): asserts `getByText('BREAKFAST')`.

After the change, an empty slot's header is still `'BREAKFAST'` (no calorie data → no KCAL suffix). This test passes `mockQueries()` (empty meal data), so the label stays plain. **No change needed.**

---

### Task 6.5 — Update Existing Test: `shows empty meal card with "Add a meal" text`

**Current** (lines 70–76): expects exactly 3 "Add a meal" texts.

With the new `MealSection` render, an empty slot still shows one "Add a meal" card. **No change needed** as long as all 3 slots are empty (which they are — `mockQueries()` passes no meals).

---

### Task 6.6 — Add New Tests

Append to the `describe('MealPlanScreen', ...)` block:

```ts
it('renders "+ ADD ANOTHER" button when slot has 1 meal', () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'breakfast',
      recipe: {
        _id: 'r1',
        title: 'Omelette',
        nutritionPerServing: { calories: 320 },
        tags: ['breakfast'],
      },
    },
  ];
  mockQueries(mockMealPlans);

  const { getByText } = render(<MealPlanScreen />);
  expect(getByText('+ ADD ANOTHER BREAKFAST')).toBeTruthy();
});

it('hides "+ ADD ANOTHER" button when slot has 3 meals', () => {
  const mockMealPlans = [
    { _id: 'mp1', mealType: 'breakfast', recipe: { _id: 'r1', title: 'Meal 1', tags: ['breakfast'] } },
    { _id: 'mp2', mealType: 'breakfast', recipe: { _id: 'r2', title: 'Meal 2', tags: ['breakfast'] } },
    { _id: 'mp3', mealType: 'breakfast', recipe: { _id: 'r3', title: 'Meal 3', tags: ['breakfast'] } },
  ];
  mockQueries(mockMealPlans);

  const { queryByText } = render(<MealPlanScreen />);
  expect(queryByText('+ ADD ANOTHER BREAKFAST')).toBeNull();
});

it('shows calorie total in section header when meals have calorie data', () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'breakfast',
      recipe: {
        _id: 'r1',
        title: 'Omelette',
        nutritionPerServing: { calories: 320 },
        tags: ['breakfast'],
      },
    },
    {
      _id: 'mp2',
      mealType: 'breakfast',
      recipe: {
        _id: 'r2',
        title: 'Croissant',
        nutritionPerServing: { calories: 180 },
        tags: ['breakfast'],
      },
    },
  ];
  mockQueries(mockMealPlans);

  const { getByText } = render(<MealPlanScreen />);
  expect(getByText('BREAKFAST — 500 KCAL')).toBeTruthy();
});

it('shows plain label when no meals have calorie data', () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'lunch',
      recipe: {
        _id: 'r1',
        title: 'Mystery Dish',
        tags: ['lunch'],
        // no nutritionPerServing
      },
    },
  ];
  mockQueries(mockMealPlans);

  const { getByText, queryByText } = render(<MealPlanScreen />);
  expect(getByText('LUNCH')).toBeTruthy();
  expect(queryByText(/KCAL/)).toBeNull();
});

it('calls changeMealMutation with correct mealPlanId when CHANGE pressed', async () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'breakfast',
      recipe: {
        _id: 'r1',
        title: 'Omelette',
        nutritionPerServing: { calories: 320 },
        tags: ['breakfast'],
      },
    },
  ];
  const mockRecipes = [
    { _id: 'r2', title: 'Pancakes', tags: ['breakfast'] },
  ];
  mockQueries(mockMealPlans, undefined, mockRecipes);

  const { getByText } = render(<MealPlanScreen />);
  fireEvent.press(getByText('CHANGE'));

  expect(mockChangeMeal).toHaveBeenCalledWith(
    expect.objectContaining({ mealPlanId: 'mp1' })
  );
});

it('renders 2 meal cards and "Add another" when slot has 2 meals', () => {
  const mockMealPlans = [
    {
      _id: 'mp1',
      mealType: 'dinner',
      recipe: { _id: 'r1', title: 'Pasta', tags: ['dinner'] },
    },
    {
      _id: 'mp2',
      mealType: 'dinner',
      recipe: { _id: 'r2', title: 'Steak', tags: ['dinner'] },
    },
  ];
  mockQueries(mockMealPlans);

  const { getAllByText, getByText } = render(<MealPlanScreen />);
  expect(getAllByText('CHANGE').length).toBe(2);
  expect(getByText('+ ADD ANOTHER DINNER')).toBeTruthy();
});
```

---

## Phase 7 — Verification

### Task 7.1 — TypeScript Check (optional, pre-test)

```bash
npx tsc --noEmit
```

Expected: 0 errors. If TypeScript reports errors, the most likely causes are:
- `api.mealPlans.changeMeal` not found → Convex types not yet regenerated (run `npx convex dev` or `npx convex codegen`)
- `mealPlan.breakfast.recipe` still referenced somewhere → check Phase 3 call sites

### Task 7.2 — Run Tests

```bash
npm test
```

**Expected:** All existing tests pass + 6 new tests pass.

**If a test fails, check:**

| Failure | Likely cause |
|---|---|
| `getByText('BREAKFAST')` fails in a test with meal data | Header now shows `'BREAKFAST — N KCAL'`; update assertion (Task 6.3) |
| `mockChangeMeal` not called | `useMutation` mock order is wrong — recount the `useMutation` calls in the component |
| `queryByText('+ ADD ANOTHER BREAKFAST')` not null at 3 meals | `meals.length < 3` condition is wrong — recheck Task 3.3 |
| `'Add a meal'` count is not 3 in empty-state test | `MealSection` empty-state block missing or conditional wrong |

### Task 7.3 — Manual Smoke Test (Expo)

```bash
npm start
```

Verify in the meal plan screen:
- [ ] Empty slot shows dashed "Add a meal" card
- [ ] After adding 1 meal, the "Add another [TYPE]" button appears below the card
- [ ] After adding 2 meals, both cards render with individual CHANGE/trash buttons
- [ ] After adding 3 meals, the "Add another" button disappears
- [ ] Section header shows `"BREAKFAST — NNN KCAL"` when calorie data exists
- [ ] CHANGE button on a specific card swaps only that card, not the others
- [ ] GENERATE RANDOM PLAN works on empty day (inserts 1 per slot)
- [ ] GENERATE RANDOM PLAN on a day with 3 breakfast meals skips breakfast silently

---

## Summary Table

| Phase | File | Tasks | Depends on |
|---|---|---|---|
| 1 — Backend | `convex/mealPlans.ts` | 1.1 modify addMeal, 1.2 add changeMeal | — |
| 2 — Types + Data | `meal-plan.tsx` | 2.1 add types, 2.2 refactor getMealPlan | Phase 1 |
| 3 — Component | `meal-plan.tsx` | 3.1–3.4 MealSection + MealCard refactor | Phase 2 |
| 4 — Handlers | `meal-plan.tsx` | 4.1–4.4 changeMeal hook + handler rewrites | Phase 3 |
| 5 — Styles | `meal-plan.tsx` | 5.1 add addAnotherButton styles | Phase 4 |
| 6 — Tests | `meal-plan.test.tsx` | 6.1–6.6 update mocks + add 6 new tests | Phase 5 |
| 7 — Verify | — | tsc + npm test + manual smoke | Phase 6 |

**Total estimated edits:** ~12 distinct code blocks across 3 files.
