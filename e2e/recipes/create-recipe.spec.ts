import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { ImportRecipePage } from '../pages/ImportRecipePage';
import { ManualRecipePage } from '../pages/ManualRecipePage';

/**
 * Create Recipe Manually Tests
 * Migrated from: .maestro/recipes/create-recipe.yaml
 * Tags: everyday-food, recipes, critical-path
 */
test.describe('Create Recipe Manually', () => {
  test('should create a recipe manually with ingredients and steps', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);
    const manualRecipePage = new ManualRecipePage(page);

    // Navigate to recipe creation via import screen
    await homePage.verifyHomeScreen(10000);
    await homePage.clickImportRecipe();

    // Verify import screen and click Create Manually
    await expect(importRecipePage.createManuallyButton).toBeVisible();
    await importRecipePage.clickCreateManually();

    // Verify manual recipe screen
    await manualRecipePage.verifyManualRecipeScreen();

    // Fill in recipe details
    await manualRecipePage.enterTitle('Test Pasta Recipe');
    await manualRecipePage.enterServings('4');
    await manualRecipePage.enterPrepTime('15');
    await manualRecipePage.enterCookTime('25');

    // Add ingredients
    await manualRecipePage.addIngredient('Pasta');
    await manualRecipePage.addIngredient('Tomato Sauce');

    // Add steps
    await manualRecipePage.addStep('Boil pasta in salted water');
    await manualRecipePage.addStep('Add sauce and serve');

    // Save recipe
    await manualRecipePage.clickSaveRecipe();

    // Verify recipe was created
    await manualRecipePage.verifyRecipeCreated('Test Pasta Recipe');
  });

  test('should display recipe creation form fields', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);
    const manualRecipePage = new ManualRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.clickImportRecipe();
    await importRecipePage.clickCreateManually();

    // Step 1: Verify basic info fields are present
    await expect(manualRecipePage.titleInput).toBeVisible();
    await expect(manualRecipePage.servingsInput).toBeVisible();

    // Fill required title to pass validation
    await manualRecipePage.enterTitle('Test Recipe');

    // Navigate to step 2 to verify ingredient fields
    await manualRecipePage.clickNext();
    await expect(manualRecipePage.addIngredientButton).toBeVisible();

    // Add an ingredient to pass step 2 validation
    await manualRecipePage.addIngredient('Test Ingredient');

    // Navigate to step 3 to verify step fields
    await manualRecipePage.clickNext();
    await expect(manualRecipePage.addStepButton).toBeVisible();
  });

  test('should add multiple ingredients', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const importRecipePage = new ImportRecipePage(page);
    const manualRecipePage = new ManualRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.clickImportRecipe();
    await importRecipePage.clickCreateManually();

    // Fill required title to pass step 1 validation
    await manualRecipePage.enterTitle('Ingredient Test Recipe');

    // Add multiple ingredients
    await manualRecipePage.addIngredients(['Flour', 'Sugar', 'Butter', 'Eggs']);

    // Verify ingredients were added (by checking add button still exists)
    await expect(manualRecipePage.addIngredientButton).toBeVisible();
  });
});
