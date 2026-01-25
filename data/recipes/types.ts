// Seed Recipe Types
// These types are for the hardcoded JSON recipe files

export type SeedDifficulty = "easy" | "medium" | "hard";
export type SeedMealType = "breakfast" | "lunch" | "dinner" | "snack";
export type SeedDietType =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "keto"
  | "low-carb";

export interface SeedIngredient {
  name: string;
  amount: number;
  unit: string;
  preparation: string | null;
  isOptional: boolean;
  group: string | null; // e.g., "For the sauce", "Toppings"
}

export interface SeedStep {
  stepNumber: number;
  instruction: string;
  timerMinutes: number | null;
  timerLabel?: string;
  tips: string | null;
}

export interface SeedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface SeedRecipe {
  id: string;
  title: string;
  description: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: SeedDifficulty;
  cuisine: string;
  mealType: SeedMealType[];
  diet: SeedDietType[];
  ingredients: SeedIngredient[];
  steps: SeedStep[];
  nutrition?: SeedNutrition;
  tags: string[];
  sourceUrl: string | null;
  notes?: string;
}
