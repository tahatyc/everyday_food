import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object
 * Handles main dashboard/home screen interactions
 * Source: Common across all Maestro tests
 */
export class HomePage extends BasePage {
  // Locators
  readonly welcomeText: Locator;
  readonly importRecipeButton: Locator;
  readonly recipesTab: Locator;
  readonly mealPlanTab: Locator;
  readonly profileTab: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeText = page.getByText('HELLO, CHEF!');
    this.importRecipeButton = page.getByText('IMPORT RECIPE');
    this.recipesTab = page.getByText('Recipes');
    this.mealPlanTab = page.getByText('Meal Plan');
    this.profileTab = page.getByText('PROFILE');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Verify home screen is displayed
   */
  async verifyHomeScreen(timeout = 10000) {
    await expect(this.welcomeText).toBeVisible({ timeout });
  }

  /**
   * Check if user is logged in (home screen visible)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.welcomeText.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click import recipe button
   */
  async clickImportRecipe() {
    await this.importRecipeButton.click();
  }

  /**
   * Navigate to Recipes tab
   */
  async goToRecipes() {
    await this.recipesTab.click();
  }

  /**
   * Navigate to Meal Plan tab
   */
  async goToMealPlan() {
    await this.mealPlanTab.click();
  }

  /**
   * Navigate to Profile tab
   */
  async goToProfile() {
    await this.profileTab.click();
  }

  /**
   * Wait for home screen to load after login/navigation
   */
  async waitForLoad(timeout = 10000) {
    await this.welcomeText.waitFor({ state: 'visible', timeout });
  }
}
