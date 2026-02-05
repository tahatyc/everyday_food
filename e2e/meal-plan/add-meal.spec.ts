import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { MealPlanPage } from '../pages/MealPlanPage';
import { SelectRecipePage } from '../pages/SelectRecipePage';

/**
 * Add Meal to Plan Tests
 * Migrated from: .maestro/meal-plan/add-meal.yaml
 * Tags: meal-plan, critical-path
 */
test.describe('Add Meal to Plan', () => {
  test('should add a recipe to meal plan', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const selectRecipePage = new SelectRecipePage(page);

    // Verify user is logged in
    await homePage.verifyHomeScreen(10000);

    // Navigate to Meal Plan tab
    await homePage.goToMealPlan();

    // Verify meal plan screen loads
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Verify day selector and meal slots are visible
    await mealPlanPage.verifyMealSlots();

    // Tap on an empty meal slot to add a meal
    const emptySlots = await mealPlanPage.getEmptySlotCount();
    if (emptySlots > 0) {
      await mealPlanPage.clickAddMeal();

      // Verify select recipe screen appears
      await selectRecipePage.verifySelectRecipeScreen(5000);

      // Verify filter chips on recipe selection
      await selectRecipePage.verifyFilterChips();

      // Select a recipe from the list (first available)
      const recipeCount = await selectRecipePage.getRecipeCount();
      if (recipeCount > 0) {
        await selectRecipePage.selectFirstRecipe();

        // Verify we return to the meal plan
        await selectRecipePage.verifyReturnToMealPlan(5000);
      }
    }
  });

  test('should display meal slots (Breakfast, Lunch, Dinner)', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Verify all meal slots are visible
    await expect(mealPlanPage.breakfastSlot).toBeVisible();
    await expect(mealPlanPage.lunchSlot).toBeVisible();
    await expect(mealPlanPage.dinnerSlot).toBeVisible();
  });

  test('should show filter chips on recipe selection screen', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const selectRecipePage = new SelectRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    const emptySlots = await mealPlanPage.getEmptySlotCount();
    if (emptySlots > 0) {
      await mealPlanPage.clickAddMeal();
      await selectRecipePage.verifySelectRecipeScreen(5000);

      // Verify filter chips
      await expect(selectRecipePage.allFilter).toBeVisible();
      await expect(selectRecipePage.breakfastFilter).toBeVisible();
    }
  });

  test('should navigate back to meal plan after selecting recipe', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const selectRecipePage = new SelectRecipePage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    const emptySlots = await mealPlanPage.getEmptySlotCount();
    if (emptySlots === 0) {
      test.skip();
      return;
    }

    await mealPlanPage.clickAddMeal();
    await selectRecipePage.verifySelectRecipeScreen(5000);

    const recipeCount = await selectRecipePage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }

    await selectRecipePage.selectFirstRecipe();

    // Verify return to meal plan
    await expect(page.getByText('WEEKLY PLANNER')).toBeVisible({ timeout: 5000 });
  });
});
