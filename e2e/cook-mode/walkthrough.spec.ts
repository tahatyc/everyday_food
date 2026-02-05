import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { RecipesPage } from '../pages/RecipesPage';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';
import { CookModePage } from '../pages/CookModePage';

/**
 * Cook Mode Step-by-Step Walkthrough Tests
 * Migrated from: .maestro/cook-mode/walkthrough.yaml
 * Tags: everyday-food, cook-mode, critical-path
 */
test.describe('Cook Mode Step-by-Step Walkthrough', () => {
  test('should navigate through cooking steps', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const cookModePage = new CookModePage(page);

    // Navigate to a recipe
    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    // Start cooking mode
    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.scrollToStartCooking();
    await recipeDetailPage.clickStartCooking();

    // Verify cook mode screen
    await cookModePage.verifyCookModeScreen();
    await cookModePage.verifyStep(1);

    // Navigate through steps (swipe left = next step)
    await cookModePage.goToNextStep();
    await cookModePage.verifyStep(2);

    // Go back to previous step (swipe right = previous step)
    await cookModePage.goToPreviousStep();
    await cookModePage.verifyStep(1);

    // Navigate forward again
    await cookModePage.goToNextStep();
    await cookModePage.verifyStep(2);

    // Try to continue (may reach end or continue)
    await cookModePage.goToNextStep();
  });

  test('should display Step 1 on cook mode start', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const cookModePage = new CookModePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.scrollToStartCooking();
    await recipeDetailPage.clickStartCooking();

    // Verify starts on Step 1
    await cookModePage.verifyStep(1);
  });

  test('should navigate forward and backward through steps', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const cookModePage = new CookModePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.scrollToStartCooking();
    await recipeDetailPage.clickStartCooking();

    await cookModePage.verifyCookModeScreen();

    // Navigate forward
    await cookModePage.goToNextStep();
    await page.waitForTimeout(300);

    // Navigate backward
    await cookModePage.goToPreviousStep();
    await page.waitForTimeout(300);

    // Should be back on step 1
    await cookModePage.verifyStep(1);
  });

  test('should use keyboard navigation for steps', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const cookModePage = new CookModePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.scrollToStartCooking();
    await recipeDetailPage.clickStartCooking();

    await cookModePage.verifyCookModeScreen();

    // Use keyboard to navigate (ArrowRight = next, ArrowLeft = previous)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
  });
});
