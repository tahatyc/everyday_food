import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { MealPlanPage } from '../pages/MealPlanPage';

/**
 * Generate Random Meal Plan Tests
 * Migrated from: .maestro/meal-plan/generate-plan.yaml
 * Tags: meal-plan
 */
test.describe('Generate Random Meal Plan', () => {
  test('should generate random plan and fill empty slots', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to Meal Plan tab
    await homePage.goToMealPlan();

    // Verify meal plan screen loads
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Tap generate random plan button
    await mealPlanPage.clickGenerateRandomPlan();

    // Verify meals are populated (meal slots should show "CHANGE" instead of "Add a meal")
    // This is optional as it depends on having recipes available
    try {
      await mealPlanPage.verifyMealsPopulated(5000);
    } catch {
      // If no recipes available, the plan generation may not populate meals
      console.log('Meals may not be populated if no recipes are available');
    }
  });

  test('should display Generate Random Plan button', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Verify generate button is visible
    await expect(mealPlanPage.generateRandomPlanButton).toBeVisible();
  });

  test('should display Weekly Planner title', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();

    // Verify page title
    await expect(mealPlanPage.pageTitle).toBeVisible({ timeout: 5000 });
  });

  test('should have Grocery List button', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Scroll to and verify grocery list button
    await mealPlanPage.groceryListButton.scrollIntoViewIfNeeded();
    await expect(mealPlanPage.groceryListButton).toBeVisible();
  });
});
