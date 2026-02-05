import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Select Recipe Page Object
 * Handles recipe selection for meal planning
 * Source: .maestro/meal-plan/add-meal.yaml
 */
export class SelectRecipePage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly allFilter: Locator;
  readonly breakfastFilter: Locator;
  readonly lunchFilter: Locator;
  readonly dinnerFilter: Locator;
  readonly snackFilter: Locator;
  readonly recipeCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('SELECT');
    this.allFilter = page.getByText('All');
    this.breakfastFilter = page.getByText('Breakfast');
    this.lunchFilter = page.getByText('Lunch');
    this.dinnerFilter = page.getByText('Dinner');
    this.snackFilter = page.getByText('Snack');
    this.recipeCards = page.locator('[data-testid^="recipe-card"], [data-testid^="select-recipe"]');
    this.searchInput = page.getByPlaceholder('Search recipes...');
  }

  /**
   * Verify select recipe screen is displayed
   */
  async verifySelectRecipeScreen(timeout = 5000) {
    await expect(this.pageTitle).toBeVisible({ timeout });
  }

  /**
   * Verify filter chips are visible
   */
  async verifyFilterChips() {
    await expect(this.allFilter).toBeVisible();
    await expect(this.breakfastFilter).toBeVisible();
  }

  /**
   * Filter by All recipes
   */
  async filterByAll() {
    await this.allFilter.click();
  }

  /**
   * Filter by Breakfast
   */
  async filterByBreakfast() {
    await this.breakfastFilter.click();
  }

  /**
   * Filter by Lunch
   */
  async filterByLunch() {
    await this.lunchFilter.click();
  }

  /**
   * Filter by Dinner
   */
  async filterByDinner() {
    await this.dinnerFilter.click();
  }

  /**
   * Filter by meal type
   */
  async filterByMealType(type: 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') {
    await this.page.getByText(type).click();
  }

  /**
   * Search for recipes
   */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /**
   * Click first recipe in the list
   */
  async selectFirstRecipe() {
    await this.recipeCards.first().click();
  }

  /**
   * Select recipe at specific index
   */
  async selectRecipeAtIndex(index: number) {
    await this.recipeCards.nth(index).click();
  }

  /**
   * Get count of available recipes
   */
  async getRecipeCount(): Promise<number> {
    return await this.recipeCards.count();
  }

  /**
   * Verify we return to meal plan after selection
   */
  async verifyReturnToMealPlan(timeout = 5000) {
    await expect(this.page.getByText('WEEKLY PLANNER')).toBeVisible({ timeout });
  }
}
