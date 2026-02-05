/**
 * Test data fixtures for E2E tests
 * Re-exports factories and provides test constants
 */

// Re-export all factories for convenience
export * from '../factories';

// Legacy aliases for backwards compatibility with existing tests
export {
  createTestRecipe,
  createTestUser,
  createTestMealPlan,
  createTestShoppingItem,
  type TestRecipe,
  type TestUser,
  type TestMealPlan,
  type TestShoppingItem,
} from '../factories';

/**
 * Common test URLs
 */
export const TEST_URLS = {
  home: '/',
  login: '/login',
  register: '/register',
  recipes: '/recipes',
  mealPlan: '/meal-plan',
  profile: '/profile',
  groceryList: '/grocery-list',
  friends: '/friends',
  import: '/import',
  manualRecipe: '/manual-recipe',
} as const;

/**
 * Common test timeouts
 */
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 15000,
} as const;
