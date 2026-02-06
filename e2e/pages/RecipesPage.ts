import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Recipes Page Object
 * Handles recipe browsing, search, and filtering
 * Source: .maestro/recipes/view-recipe.yaml, favorite-recipe.yaml
 */
export class RecipesPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly allFilter: Locator;
  readonly myRecipesFilter: Locator;
  readonly favoritesFilter: Locator;
  readonly breakfastFilter: Locator;
  readonly lunchFilter: Locator;
  readonly dinnerFilter: Locator;
  readonly snackFilter: Locator;
  readonly recipeCards: Locator;

  constructor(page: Page) {
    super(page);
    // Use more specific selectors for React Native Web
    this.pageTitle = page.getByText(/^recipes$/i).first();
    this.searchInput = page.getByPlaceholder(/search recipes/i);

    // Filter chips - use exact match and first occurrence (the chip, not recipe text)
    // The filter chips are typically styled differently and appear in a filter bar
    this.allFilter = page.getByText('All', { exact: true }).first();
    this.myRecipesFilter = page.getByText('My Recipes', { exact: true }).first();
    this.favoritesFilter = page.getByText('Favorites', { exact: true }).first();
    this.breakfastFilter = page.getByText('Breakfast', { exact: true }).first();
    this.lunchFilter = page.getByText('Lunch', { exact: true }).first();
    this.dinnerFilter = page.getByText('Dinner', { exact: true }).first();
    this.snackFilter = page.getByText('Snack', { exact: true }).first();

    // Recipe cards - use general locator since test IDs might not exist
    this.recipeCards = page.locator('[data-testid^="recipe-card"]').or(
      page.locator('[role="button"]').filter({ hasText: /cook time|prep time|servings/i })
    );
  }

  /**
   * Navigate to recipes page
   */
  async goto() {
    await super.goto('/(tabs)/recipes');
  }

  /**
   * Verify recipes screen is displayed
   */
  async verifyRecipesScreen(timeout = 5000) {
    await expect(this.pageTitle).toBeVisible({ timeout });
  }

  /**
   * Verify filter chips are visible
   */
  async verifyFilterChips() {
    await expect(this.allFilter).toBeVisible();
    await expect(this.myRecipesFilter).toBeVisible();
  }

  /**
   * Search for recipes
   */
  async search(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
  }

  /**
   * Clear search input
   */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /**
   * Filter by All recipes
   */
  async filterByAll() {
    await this.allFilter.click();
  }

  /**
   * Filter by My Recipes
   */
  async filterByMyRecipes() {
    await this.myRecipesFilter.click();
  }

  /**
   * Filter by Favorites
   */
  async filterByFavorites() {
    await this.favoritesFilter.click();
  }

  /**
   * Filter by Breakfast
   */
  async filterByBreakfast() {
    await this.breakfastFilter.click();
  }

  /**
   * Filter by meal type
   */
  async filterByMealType(type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') {
    await this.page.getByText(type).click();
  }

  /**
   * Click on first recipe in the list
   */
  async clickFirstRecipe() {
    await this.recipeCards.first().click();
  }

  /**
   * Click on recipe at specific index
   */
  async clickRecipeAtIndex(index: number) {
    await this.recipeCards.nth(index).click();
  }

  /**
   * Get count of visible recipe cards
   */
  async getRecipeCount(): Promise<number> {
    return await this.recipeCards.count();
  }

  /**
   * Wait for search results to appear
   * Waits for any recipe cards or the "no results" message
   */
  async waitForSearchResults(timeout = 5000) {
    // Wait for either recipe cards or a count indicator like "X recipes"
    await this.page.waitForTimeout(500); // Brief wait for search to execute
    // Try to find recipe cards or count text
    const hasResults = await Promise.race([
      this.recipeCards.first().waitFor({ state: 'visible', timeout }).then(() => true),
      this.page.getByText(/\d+\s*recipes?/i).first().waitFor({ state: 'visible', timeout }).then(() => true),
      this.page.getByText(/no recipes found/i).waitFor({ state: 'visible', timeout }).then(() => true),
    ]).catch(() => false);

    if (!hasResults) {
      throw new Error('No search results or feedback found');
    }
  }

  /**
   * Verify recipe count text is displayed (e.g., "6 recipes")
   */
  async verifyRecipeCountDisplayed(timeout = 5000) {
    await expect(this.page.getByText(/\d+\s*recipes?/i).first()).toBeVisible({ timeout });
  }
}
