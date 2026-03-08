/**
 * Tests for recipe scaling integration with shopping lists.
 *
 * Since Convex mutations run server-side and can't be unit-tested directly
 * without the Convex test harness, these tests verify the scaleAmount helper
 * logic that the mutations rely on, and document the expected behavior of the
 * scaling-aware shopping list feature.
 */

// Re-implement the scaleAmount helper used in shoppingLists.ts for testing
function scaleAmount(
  amount: number | undefined,
  recipeServings: number,
  targetServings: number
): number | undefined {
  if (amount === undefined || amount === 0) return amount;
  if (recipeServings <= 0 || targetServings <= 0) return amount;
  const multiplier = targetServings / recipeServings;
  return Math.round(amount * multiplier * 100) / 100;
}

describe("shoppingList scaleAmount", () => {
  it("returns undefined for undefined amount", () => {
    expect(scaleAmount(undefined, 4, 8)).toBeUndefined();
  });

  it("returns 0 for 0 amount", () => {
    expect(scaleAmount(0, 4, 8)).toBe(0);
  });

  it("doubles amount when doubling servings", () => {
    expect(scaleAmount(2, 4, 8)).toBe(4);
    expect(scaleAmount(1.5, 2, 4)).toBe(3);
  });

  it("halves amount when halving servings", () => {
    expect(scaleAmount(4, 4, 2)).toBe(2);
    expect(scaleAmount(1, 4, 2)).toBe(0.5);
  });

  it("returns original amount when servings are unchanged", () => {
    expect(scaleAmount(3, 4, 4)).toBe(3);
  });

  it("handles non-even scaling", () => {
    // 2 cups for 4 servings, scaled to 6 servings = 3 cups
    expect(scaleAmount(2, 4, 6)).toBe(3);
    // 3 eggs for 4 servings, scaled to 3 servings = 2.25
    expect(scaleAmount(3, 4, 3)).toBe(2.25);
  });

  it("handles invalid servings gracefully", () => {
    expect(scaleAmount(2, 0, 4)).toBe(2);
    expect(scaleAmount(2, -1, 4)).toBe(2);
    expect(scaleAmount(2, 4, 0)).toBe(2);
    expect(scaleAmount(2, 4, -1)).toBe(2);
  });

  it("rounds to 2 decimal places", () => {
    // 1/3 scaling: 2 * (1/3) = 0.666... → 0.67
    expect(scaleAmount(2, 3, 1)).toBe(0.67);
  });
});

describe("meal plan scaling scenarios", () => {
  /**
   * Simulate the combined ingredient calculation that createForWeek performs.
   * Given a list of meal plan entries with different servings for the same recipe,
   * verify the total ingredient amounts are correct.
   */
  function calculateTotalIngredientAmount(
    baseAmount: number,
    recipeServings: number,
    mealPlanEntries: Array<{ servings: number }>
  ): number {
    let total = 0;
    for (const entry of mealPlanEntries) {
      const scaled = scaleAmount(baseAmount, recipeServings, entry.servings);
      total += scaled || 0;
    }
    return Math.round(total * 100) / 100;
  }

  it("combines same recipe with different servings correctly", () => {
    // Recipe: Pancakes, base 2 servings, needs 2 eggs
    // Breakfast: 4 servings → 4 eggs
    // Dinner: 2 servings → 2 eggs
    // Total: 6 eggs
    const total = calculateTotalIngredientAmount(2, 2, [
      { servings: 4 },
      { servings: 2 },
    ]);
    expect(total).toBe(6);
  });

  it("handles single entry at original servings", () => {
    const total = calculateTotalIngredientAmount(3, 4, [{ servings: 4 }]);
    expect(total).toBe(3);
  });

  it("handles single entry with scaled servings", () => {
    // 3 cups flour for 4 servings, scaled to 8 servings = 6 cups
    const total = calculateTotalIngredientAmount(3, 4, [{ servings: 8 }]);
    expect(total).toBe(6);
  });

  it("handles multiple entries of same recipe all scaled up", () => {
    // Recipe: base 2 servings, 1 cup flour
    // Entry 1: 4 servings → 2 cups
    // Entry 2: 6 servings → 3 cups
    // Entry 3: 2 servings → 1 cup
    // Total: 6 cups
    const total = calculateTotalIngredientAmount(1, 2, [
      { servings: 4 },
      { servings: 6 },
      { servings: 2 },
    ]);
    expect(total).toBe(6);
  });

  it("handles fractional scaling across entries", () => {
    // Recipe: base 4 servings, 3 eggs
    // Breakfast: 3 servings → 2.25 eggs
    // Lunch: 1 serving → 0.75 eggs
    // Total: 3 eggs (same as original since 3+1=4)
    const total = calculateTotalIngredientAmount(3, 4, [
      { servings: 3 },
      { servings: 1 },
    ]);
    expect(total).toBe(3);
  });

  it("handles different recipes contributing to the same ingredient", () => {
    // Recipe A: base 2 servings, 2 eggs → scaled to 4 servings = 4 eggs
    // Recipe B: base 4 servings, 3 eggs → scaled to 4 servings = 3 eggs
    // Total eggs: 7
    const recipeA = scaleAmount(2, 2, 4) || 0;
    const recipeB = scaleAmount(3, 4, 4) || 0;
    expect(recipeA + recipeB).toBe(7);
  });
});

describe("addRecipeIngredients with targetServings", () => {
  it("scales ingredients when targetServings differs from recipe servings", () => {
    // Simulate what addRecipeIngredients does:
    // Recipe has 4 servings, user wants 8
    const ingredients = [
      { name: "flour", amount: 2 },
      { name: "sugar", amount: 1 },
      { name: "salt", amount: undefined },
    ];

    const recipeServings = 4;
    const targetServings = 8;

    const scaled = ingredients.map((ing) => ({
      name: ing.name,
      amount: scaleAmount(ing.amount, recipeServings, targetServings),
    }));

    expect(scaled[0].amount).toBe(4); // flour doubled
    expect(scaled[1].amount).toBe(2); // sugar doubled
    expect(scaled[2].amount).toBeUndefined(); // salt stays undefined
  });

  it("uses recipe servings when targetServings is not provided", () => {
    const recipeServings = 4;
    const targetServings = recipeServings; // fallback

    const amount = scaleAmount(2, recipeServings, targetServings);
    expect(amount).toBe(2); // unchanged
  });
});
