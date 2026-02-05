import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { RecipesPage } from '../pages/RecipesPage';

/**
 * Favorite Recipe Flow Tests
 * Migrated from: .maestro/recipes/favorite-recipe.yaml
 * Tags: recipes
 */
test.describe('Favorite Recipe Flow', () => {
  test('should toggle between All and Favorites filters', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to Recipes tab
    await homePage.goToRecipes();

    // Verify recipes screen loads
    await recipesPage.verifyRecipesScreen(5000);

    // Filter by favorites (should be empty or show favorited recipes)
    await recipesPage.filterByFavorites();

    // Go back to all recipes
    await recipesPage.filterByAll();

    // Verify recipe count is displayed
    await recipesPage.verifyRecipeCountDisplayed(5000);
  });

  test('should display Favorites filter chip', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Verify Favorites filter is visible
    await expect(recipesPage.favoritesFilter).toBeVisible();
  });

  test('should filter recipes by All', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Click All filter
    await recipesPage.filterByAll();

    // Verify All filter is clickable and works
    await expect(recipesPage.allFilter).toBeVisible();
  });

  test('should switch between filters', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Switch through filters
    await recipesPage.filterByFavorites();
    await page.waitForTimeout(500);

    await recipesPage.filterByMyRecipes();
    await page.waitForTimeout(500);

    await recipesPage.filterByAll();
    await page.waitForTimeout(500);
  });
});
