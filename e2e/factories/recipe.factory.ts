/**
 * Recipe test data factory
 * Generates test data for recipe-related E2E tests
 */

export interface TestRecipe {
  title: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: TestIngredient[];
  steps: string[];
  tags?: string[];
  imageUrl?: string;
}

export interface TestIngredient {
  name: string;
  amount: string;
  unit: string;
}

/**
 * Generate a unique test recipe
 */
export function createTestRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  const timestamp = Date.now();
  return {
    title: `Test Recipe ${timestamp}`,
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    ingredients: [
      { name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
      { name: 'Test Ingredient 2', amount: '2', unit: 'tbsp' },
      { name: 'Test Ingredient 3', amount: '3', unit: 'pieces' },
    ],
    steps: [
      'Step 1: Prepare all ingredients and gather equipment',
      'Step 2: Cook the main components',
      'Step 3: Combine and serve',
    ],
    tags: [],
    ...overrides,
  };
}

/**
 * Generate a quick recipe (under 30 min total)
 */
export function createQuickRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return createTestRecipe({
    title: `Quick Recipe ${Date.now()}`,
    prepTime: 5,
    cookTime: 15,
    ...overrides,
  });
}

/**
 * Generate a breakfast recipe
 */
export function createBreakfastRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return createTestRecipe({
    title: `Breakfast ${Date.now()}`,
    prepTime: 10,
    cookTime: 15,
    ingredients: [
      { name: 'Eggs', amount: '2', unit: 'large' },
      { name: 'Butter', amount: '1', unit: 'tbsp' },
      { name: 'Toast', amount: '2', unit: 'slices' },
    ],
    steps: [
      'Heat butter in a pan over medium heat',
      'Crack eggs and cook to desired doneness',
      'Serve with toast',
    ],
    tags: ['Breakfast'],
    ...overrides,
  });
}

/**
 * Generate a dinner recipe
 */
export function createDinnerRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return createTestRecipe({
    title: `Dinner ${Date.now()}`,
    prepTime: 20,
    cookTime: 45,
    ingredients: [
      { name: 'Chicken breast', amount: '2', unit: 'pieces' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp' },
      { name: 'Garlic', amount: '3', unit: 'cloves' },
      { name: 'Salt', amount: '1', unit: 'tsp' },
      { name: 'Pepper', amount: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 400°F',
      'Season chicken with salt, pepper, and garlic',
      'Drizzle with olive oil',
      'Bake for 25-30 minutes until cooked through',
      'Rest for 5 minutes before serving',
    ],
    tags: ['Dinner'],
    ...overrides,
  });
}

/**
 * Generate a pasta recipe (commonly used in tests)
 */
export function createPastaRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return createTestRecipe({
    title: `Test Pasta Recipe ${Date.now()}`,
    servings: 4,
    prepTime: 15,
    cookTime: 25,
    ingredients: [
      { name: 'Pasta', amount: '400', unit: 'g' },
      { name: 'Tomato Sauce', amount: '2', unit: 'cups' },
      { name: 'Parmesan', amount: '1/2', unit: 'cup' },
      { name: 'Basil', amount: '1/4', unit: 'cup' },
    ],
    steps: [
      'Boil pasta in salted water according to package directions',
      'Heat tomato sauce in a separate pan',
      'Drain pasta and combine with sauce',
      'Top with parmesan and fresh basil',
    ],
    tags: ['Dinner', 'Italian'],
    ...overrides,
  });
}

/**
 * Generate an ingredient
 */
export function createTestIngredient(overrides: Partial<TestIngredient> = {}): TestIngredient {
  return {
    name: `Ingredient ${Date.now()}`,
    amount: '1',
    unit: 'cup',
    ...overrides,
  };
}

/**
 * Common recipe URLs for import testing
 */
export const IMPORT_TEST_URLS = {
  valid: 'https://www.example.com/recipe/test-recipe',
  invalid: 'not-a-url',
  notFound: 'https://www.example.com/recipe/does-not-exist',
};
