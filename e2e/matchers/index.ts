/**
 * Custom matchers for E2E tests
 * Re-exports all domain-specific and UI matchers
 */

// Recipe-specific matchers
export {
  assertRecipeCardVisible,
  assertRecipeDetailLoaded,
  assertRecipeHasSteps,
  assertRecipeHasIngredient,
  assertRecipeCookingActionsVisible,
  assertRecipeFiltersVisible,
  assertRecipeSearchVisible,
  assertMealTypeFiltersVisible,
  assertRecipeListNotEmpty,
  assertRecipeCreated,
  assertRecipeFavorited,
  recipeFormMatchers,
  shareModalMatchers,
} from './recipe.matchers';

// UI state matchers
export {
  assertLoading,
  assertLoadingComplete,
  assertEmptyState,
  assertError,
  assertSuccess,
  assertModalOpen,
  assertModalClosed,
  assertTabActive,
  assertOnScreen,
  assertHomeScreen,
  assertRecipesScreen,
  assertMealPlanScreen,
  assertGroceryListScreen,
  assertProfileScreen,
  assertFriendsScreen,
  mealPlanMatchers,
  groceryListMatchers,
  authMatchers,
  cookModeMatchers,
} from './ui.matchers';
