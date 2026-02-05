/**
 * Test data factories for E2E tests
 * Re-exports all factory functions and types
 */

// Recipe factories
export {
  createTestRecipe,
  createQuickRecipe,
  createBreakfastRecipe,
  createDinnerRecipe,
  createPastaRecipe,
  createTestIngredient,
  IMPORT_TEST_URLS,
  type TestRecipe,
  type TestIngredient,
} from './recipe.factory';

// User factories
export {
  createTestUser,
  createInvalidEmailUser,
  createWeakPasswordUser,
  createTestUsers,
  DEFAULT_TEST_USER,
  SECONDARY_TEST_USER,
  LOGIN_CREDENTIALS,
  type TestUser,
} from './user.factory';

// Meal plan factories
export {
  createTestMealPlan,
  createBreakfastPlan,
  createLunchPlan,
  createDinnerPlan,
  createSnackPlan,
  createEmptyDayPlan,
  createFullDayPlan,
  createEmptyWeekPlan,
  getTodayDate,
  getDateOffset,
  MEAL_TYPE_LABELS,
  DAY_NAMES,
  type MealType,
  type TestMealPlan,
  type TestMealSlot,
  type TestDayPlan,
} from './mealPlan.factory';

// Shopping list factories
export {
  createTestShoppingItem,
  createProduceItem,
  createDairyItem,
  createMeatItem,
  createBakeryItem,
  createShoppingItems,
  createTestShoppingList,
  createEmptyShoppingList,
  createListFromRecipe,
  createPartiallyCheckedList,
  AISLES,
  type TestShoppingItem,
  type TestShoppingList,
} from './shoppingList.factory';
