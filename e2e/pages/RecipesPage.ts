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
    this.pageTitle = page.getByText('Recipes').first();
    this.searchInput = page.getByPlaceholder('Search recipes...');
    this.allFilter = page.getByText('All');
    this.myRecipesFilter = page.getByText('My Recipes');
    this.favoritesFilter = page.getByText('Favorites');
    this.breakfastFilter = page.getByText('Breakfast');
    this.lunchFilter = page.getByText('Lunch');
    this.dinnerFilter = page.getByText('Dinner');
    this.snackFilter = page.getByText('Snack');
    this.recipeCards = page.locator('[data-testid^="recipe-card"]');
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
   */
  async waitForSearchResults(timeout = 5000) {
    await expect(this.page.getByText('recipe')).toBeVisible({ timeout });
  }

  /**
   * Verify recipe count text is displayed
   */
  async verifyRecipeCountDisplayed(timeout = 5000) {
    await expect(this.page.getByText('recipe')).toBeVisible({ timeout });
  }
}
