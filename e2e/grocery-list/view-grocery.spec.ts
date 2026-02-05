import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { MealPlanPage } from '../pages/MealPlanPage';
import { GroceryListPage } from '../pages/GroceryListPage';

/**
 * View Grocery List Tests
 * Migrated from: .maestro/grocery-list/view-grocery.yaml
 * Tags: grocery, critical-path
 */
test.describe('View Grocery List', () => {
  test('should display grocery list and toggle views', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to Meal Plan tab first
    await homePage.goToMealPlan();

    // Verify meal plan screen loads
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Navigate to Grocery List
    await mealPlanPage.goToGroceryList();

    // Verify grocery list screen loads
    await groceryListPage.verifyGroceryListScreen(5000);

    // Verify view toggle buttons
    await groceryListPage.verifyViewToggleButtons();

    // Toggle to recipe view
    await groceryListPage.switchToRecipeView();

    // Toggle back to aisle view
    await groceryListPage.switchToAisleView();

    // Verify checkout button is present
    await groceryListPage.verifyCheckoutButtonVisible();

    // Navigate back
    await groceryListPage.goBack();
    await groceryListPage.verifyReturnToMealPlan(5000);
  });

  test('should display Aisle and Recipe view buttons', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();
    await groceryListPage.verifyGroceryListScreen(5000);

    // Verify view toggle buttons
    await expect(groceryListPage.aisleViewButton).toBeVisible();
    await expect(groceryListPage.recipeViewButton).toBeVisible();
  });

  test('should switch between Aisle and Recipe views', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();
    await groceryListPage.verifyGroceryListScreen(5000);

    // Switch to Recipe view
    await groceryListPage.switchToRecipeView();
    await page.waitForTimeout(300);

    // Switch back to Aisle view
    await groceryListPage.switchToAisleView();
    await page.waitForTimeout(300);
  });

  test('should display checkout button', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();
    await groceryListPage.verifyGroceryListScreen(5000);

    // Verify checkout button
    await expect(groceryListPage.checkoutButton).toBeVisible();
  });
});
