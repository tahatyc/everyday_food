import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { ImportRecipePage } from '../pages/ImportRecipePage';

/**
 * Import Recipe Flow Tests
 * Migrated from: .maestro/recipes/import-recipe.yaml
 * Tags: recipes, critical-path
 */
test.describe('Import Recipe Flow', () => {
  test('should display import screen elements', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to import screen via home screen button
    await homePage.clickImportRecipe();

    // Verify import screen elements
    await importRecipePage.verifyImportScreen();
  });

  test('should import recipe via URL', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to import screen
    await homePage.clickImportRecipe();

    // Verify import screen elements
    await expect(importRecipePage.pageTitle).toBeVisible();
    await expect(importRecipePage.pasteLinkSection).toBeVisible();
    await expect(importRecipePage.urlLabel).toBeVisible();

    // Enter a recipe URL
    await importRecipePage.enterUrl('https://www.example.com/recipe/chocolate-cake');

    // Tap import button
    await importRecipePage.clickImport();

    // Verify syncing state appears
    await importRecipePage.verifySyncingState(5000);

    // Wait for import to complete (returns to home screen)
    await importRecipePage.waitForImportComplete(15000);
  });

  test('should show Create Manually option', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.clickImportRecipe();

    // Verify Create Manually button is visible
    await expect(importRecipePage.createManuallyButton).toBeVisible();
  });

  test('should have empty URL input initially', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.clickImportRecipe();

    // Verify URL input is empty
    await importRecipePage.verifyUrlInputEmpty();
  });
});
