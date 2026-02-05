/**
 * Meal plan test data factory
 * Generates test data for meal planning E2E tests
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface TestMealPlan {
  date: string;
  mealType: MealType;
  recipeTitle: string;
}

export interface TestMealSlot {
  mealType: MealType;
  isEmpty: boolean;
  recipeTitle?: string;
}

export interface TestDayPlan {
  date: string;
  meals: TestMealSlot[];
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date offset from today
 */
export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a test meal plan entry
 */
export function createTestMealPlan(overrides: Partial<TestMealPlan> = {}): TestMealPlan {
  return {
    date: getTodayDate(),
    mealType: 'dinner',
    recipeTitle: 'Test Recipe',
    ...overrides,
  };
}

/**
 * Generate a breakfast meal plan
 */
export function createBreakfastPlan(recipeTitle: string, date?: string): TestMealPlan {
  return {
    date: date ?? getTodayDate(),
    mealType: 'breakfast',
    recipeTitle,
  };
}

/**
 * Generate a lunch meal plan
 */
export function createLunchPlan(recipeTitle: string, date?: string): TestMealPlan {
  return {
    date: date ?? getTodayDate(),
    mealType: 'lunch',
    recipeTitle,
  };
}

/**
 * Generate a dinner meal plan
 */
export function createDinnerPlan(recipeTitle: string, date?: string): TestMealPlan {
  return {
    date: date ?? getTodayDate(),
    mealType: 'dinner',
    recipeTitle,
  };
}

/**
 * Generate a snack meal plan
 */
export function createSnackPlan(recipeTitle: string, date?: string): TestMealPlan {
  return {
    date: date ?? getTodayDate(),
    mealType: 'snack',
    recipeTitle,
  };
}

/**
 * Generate an empty day plan
 */
export function createEmptyDayPlan(date?: string): TestDayPlan {
  return {
    date: date ?? getTodayDate(),
    meals: [
      { mealType: 'breakfast', isEmpty: true },
      { mealType: 'lunch', isEmpty: true },
      { mealType: 'dinner', isEmpty: true },
      { mealType: 'snack', isEmpty: true },
    ],
  };
}

/**
 * Generate a full day plan with all meals
 */
export function createFullDayPlan(date?: string, recipes?: string[]): TestDayPlan {
  const defaultRecipes = recipes ?? [
    'Breakfast Recipe',
    'Lunch Recipe',
    'Dinner Recipe',
    'Snack Recipe',
  ];

  return {
    date: date ?? getTodayDate(),
    meals: [
      { mealType: 'breakfast', isEmpty: false, recipeTitle: defaultRecipes[0] },
      { mealType: 'lunch', isEmpty: false, recipeTitle: defaultRecipes[1] },
      { mealType: 'dinner', isEmpty: false, recipeTitle: defaultRecipes[2] },
      { mealType: 'snack', isEmpty: false, recipeTitle: defaultRecipes[3] },
    ],
  };
}

/**
 * Generate a week of empty plans
 */
export function createEmptyWeekPlan(startDate?: string): TestDayPlan[] {
  const start = startDate ? new Date(startDate) : new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return createEmptyDayPlan(date.toISOString().split('T')[0]);
  });
}

/**
 * Meal type display names (uppercase as shown in UI)
 */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
};

/**
 * Day names for week display
 */
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
