import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { RecipesPage } from '../pages/RecipesPage';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';
import { MealPlanPage } from '../pages/MealPlanPage';
import { GroceryListPage } from '../pages/GroceryListPage';

/**
 * Generate Shopping List from Recipes Tests
 * Migrated from: .maestro/grocery-list/generate-list.yaml
 * Tags: everyday-food, grocery-list, critical-path
 */
test.describe('Generate Shopping List from Recipes', () => {
  test('should add item manually to shopping list', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    // Navigate to a recipe detail
    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount > 0) {
      await recipesPage.clickFirstRecipe();

      // Verify on recipe detail page
      await recipeDetailPage.verifyRecipeDetailScreen();
      await recipeDetailPage.verifyIngredientsVisible();

      // Navigate to meal plan
      await recipeDetailPage.clickBack();
    }

    // Go to Plan tab
    await page.getByText('Plan').click();

    // Go to grocery list from meal plan
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();

    // Verify shopping list screen
    await groceryListPage.verifyShoppingListScreen();

    // Add an item manually
    await groceryListPage.clickAddItem();
    await groceryListPage.addItem('Milk');

    // Verify item was added
    await groceryListPage.verifyItemInList('Milk');

    // Toggle the item
    await groceryListPage.toggleItem('Milk');
  });

  test('should navigate from recipe to grocery list', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);

    // Go to Plan tab
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);

    // Navigate to grocery list
    await mealPlanPage.goToGroceryList();

    // Verify on shopping list screen
    await expect(groceryListPage.shoppingListTitle).toBeVisible();
  });

  test('should display progress indicator', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();

    // Verify progress indicator is visible
    await expect(groceryListPage.progressText).toBeVisible();
  });

  test('should toggle items in shopping list', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const mealPlanPage = new MealPlanPage(page);
    const groceryListPage = new GroceryListPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToMealPlan();
    await mealPlanPage.verifyMealPlanScreen(5000);
    await mealPlanPage.goToGroceryList();
    await groceryListPage.verifyShoppingListScreen();

    // Add an item first
    await groceryListPage.clickAddItem();
    await groceryListPage.addItem('Eggs');

    // Verify and toggle
    await groceryListPage.verifyItemInList('Eggs');
    await groceryListPage.toggleItem('Eggs');
  });
});
