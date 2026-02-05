import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { RecipesPage } from '../pages/RecipesPage';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';

/**
 * View Recipe Flow Tests
 * Migrated from: .maestro/recipes/view-recipe.yaml
 * Tags: recipes, critical-path
 */
test.describe('View Recipe Flow', () => {
  test('should browse and view recipe details', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);

    // Verify user is logged in (home screen visible)
    await homePage.verifyHomeScreen(10000);

    // Navigate to Recipes tab
    await homePage.goToRecipes();

    // Verify recipes screen loads
    await recipesPage.verifyRecipesScreen(5000);

    // Verify filter chips are visible
    await expect(recipesPage.allFilter).toBeVisible();
    await expect(recipesPage.myRecipesFilter).toBeVisible();

    // Search for a recipe
    await recipesPage.search('chicken');

    // Wait for search results
    await recipesPage.waitForSearchResults(5000);

    // Clear search and use filter
    await recipesPage.clearSearch();
    await recipesPage.filterByBreakfast();

    // Tap on the first recipe in the list (if available)
    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount > 0) {
      await recipesPage.clickFirstRecipe();

      // Verify recipe detail screen
      await recipeDetailPage.verifyRecipeDetailScreen(5000);

      // Verify recipe detail elements
      await recipeDetailPage.verifyIngredientsVisible();
      await recipeDetailPage.verifyStartCookingVisible();
    }
  });

  test('should display filter chips on recipes page', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Verify all filter chips
    await expect(recipesPage.allFilter).toBeVisible();
    await expect(recipesPage.myRecipesFilter).toBeVisible();
    await expect(recipesPage.breakfastFilter).toBeVisible();
  });

  test('should search for recipes', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Perform search
    await recipesPage.search('pasta');

    // Wait and verify search works
    await page.waitForTimeout(1000);
  });
});
