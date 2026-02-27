export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍝",
  snack: "🍪",
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * Get the emoji for a meal type.
 */
export function getMealTypeEmoji(mealType: string): string {
  return MEAL_TYPE_EMOJIS[mealType as MealType] ?? "🍝";
}

/**
 * Get the display label for a meal type.
 */
export function getMealTypeLabel(mealType: string): string {
  return MEAL_TYPE_LABELS[mealType as MealType] ?? "Dinner";
}

/**
 * Extract meal type from a recipe's tags array. Defaults to "dinner".
 */
export function getMealTypeFromTags(tags?: string[]): MealType {
  if (!tags) return "dinner";
  const found = tags.find((t) => MEAL_TYPES.includes(t.toLowerCase() as MealType));
  return (found?.toLowerCase() as MealType) ?? "dinner";
}
