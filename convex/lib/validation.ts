/**
 * Input validation helpers for Convex mutation handlers.
 * These enforce constraints that v.string()/v.number() cannot express.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateString(value: string, fieldName: string): void {
  if (!DATE_REGEX.test(value)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
  }
}

export function validateStringLength(
  value: string | undefined,
  fieldName: string,
  maxLength: number
): void {
  if (value && value.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
}

export function validateNumberRange(
  value: number | undefined,
  fieldName: string,
  min: number,
  max: number
): void {
  if (value !== undefined && (value < min || value > max)) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
}

export function validateArrayLength(
  arr: unknown[],
  fieldName: string,
  maxLength: number
): void {
  if (arr.length > maxLength) {
    throw new Error(`${fieldName} can have at most ${maxLength} items`);
  }
}

export function validateUrl(value: string | undefined, fieldName: string): void {
  if (value && value.length > 2048) {
    throw new Error(`${fieldName} URL is too long`);
  }
  if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
    throw new Error(`${fieldName} must be a valid HTTP(S) URL`);
  }
}

/** Validate all fields in a recipe create/update payload */
export function validateRecipeInput(args: {
  title: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  description?: string;
  cuisine?: string;
  ingredients: unknown[];
  steps: unknown[];
  nutritionPerServing?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}): void {
  validateStringLength(args.title, "title", 200);
  validateStringLength(args.description, "description", 5000);
  validateStringLength(args.cuisine, "cuisine", 100);
  validateNumberRange(args.servings, "servings", 1, 100);
  validateNumberRange(args.prepTime, "prepTime", 0, 1440);
  validateNumberRange(args.cookTime, "cookTime", 0, 1440);
  validateArrayLength(args.ingredients, "ingredients", 100);
  validateArrayLength(args.steps, "steps", 50);

  if (args.nutritionPerServing) {
    const n = args.nutritionPerServing;
    validateNumberRange(n.calories, "calories", 0, 10000);
    validateNumberRange(n.protein, "protein", 0, 1000);
    validateNumberRange(n.carbs, "carbs", 0, 1000);
    validateNumberRange(n.fat, "fat", 0, 1000);
    validateNumberRange(n.fiber, "fiber", 0, 1000);
    validateNumberRange(n.sugar, "sugar", 0, 1000);
    validateNumberRange(n.sodium, "sodium", 0, 50000);
  }
}
