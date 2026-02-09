import { Id } from "../../convex/_generated/dataModel";

// ==================== RECIPE TYPES ====================

export type Difficulty = "easy" | "medium" | "hard";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type DietType =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "keto"
  | "low-carb";
export type SourceType = "manual" | "imported" | "ai_extracted" | "seed";

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Ingredient {
  _id?: Id<"ingredients">;
  recipeId?: Id<"recipes">;
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
  isOptional?: boolean;
  group?: string;
  sortOrder: number;
}

export interface Step {
  _id?: Id<"steps">;
  recipeId?: Id<"recipes">;
  stepNumber: number;
  instruction: string;
  photo?: Id<"_storage">;
  photoUrl?: string;
  timerMinutes?: number;
  timerLabel?: string;
  tips?: string;
}

export interface Recipe {
  _id: Id<"recipes">;
  userId: Id<"users">;
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings: number;
  sourceUrl?: string;
  sourceType?: SourceType;
  coverImage?: Id<"_storage">;
  coverImageUrl?: string;
  photos?: Id<"_storage">[];
  difficulty?: Difficulty;
  cuisine?: string;
  nutritionPerServing?: Nutrition;
  nutritionLastCalculated?: number;
  isPublic?: boolean;
  isFavorite?: boolean;
  rating?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  lastCookedAt?: number;
  cookCount?: number;
  // Joined data
  ingredients?: Ingredient[];
  steps?: Step[];
  tags?: Tag[];
}

// ==================== ORGANIZATION TYPES ====================

export type TagType = "meal_type" | "cuisine" | "diet" | "course" | "custom";

export interface Tag {
  _id: Id<"tags">;
  userId: Id<"users">;
  name: string;
  type: TagType;
  color?: string;
  icon?: string;
}

// ==================== MEAL PLANNING TYPES ====================

export interface MealPlan {
  _id: Id<"mealPlans">;
  userId: Id<"users">;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId?: Id<"recipes">;
  recipe?: Recipe;
  customMealName?: string;
  servings?: number;
  notes?: string;
  isCompleted?: boolean;
  createdAt: number;
}

export interface DayMeals {
  date: string;
  breakfast?: MealPlan;
  lunch?: MealPlan;
  dinner?: MealPlan;
  snack?: MealPlan;
}

// ==================== SHOPPING TYPES ====================

export interface ShoppingList {
  _id: Id<"shoppingLists">;
  userId: Id<"users">;
  name: string;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  itemCount?: number;
  checkedCount?: number;
}

export interface ShoppingItem {
  _id: Id<"shoppingItems">;
  listId: Id<"shoppingLists">;
  name: string;
  amount?: number;
  unit?: string;
  recipeId?: Id<"recipes">;
  recipeName?: string;
  isManual?: boolean;
  aisle?: string;
  category?: string;
  isChecked: boolean;
  checkedAt?: number;
  sortOrder?: number;
  originalItems?: Array<{
    recipeId: Id<"recipes">;
    amount: number;
    unit: string;
  }>;
}

// ==================== COOKING SESSION TYPES ====================

export interface CookingSession {
  _id: Id<"cookingSessions">;
  userId: Id<"users">;
  recipeId: Id<"recipes">;
  recipe?: Recipe;
  currentStep: number;
  startedAt: number;
  completedAt?: number;
  servingsMultiplier?: number;
  activeTimers?: Array<{
    stepNumber: number;
    endsAt: number;
    label?: string;
  }>;
}

// ==================== FORM TYPES ====================

export interface RecipeFormData {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: Difficulty;
  cuisine?: string;
  sourceUrl?: string;
  ingredients: IngredientFormData[];
  steps: StepFormData[];
  tagIds?: Id<"tags">[];
}

export interface IngredientFormData {
  id?: string; // temporary ID for form
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
  isOptional?: boolean;
  group?: string;
}

export interface StepFormData {
  id?: string; // temporary ID for form
  instruction: string;
  timerMinutes?: number;
  timerLabel?: string;
  tips?: string;
  photo?: string; // local URI for new photos
}
