import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object
 * Handles main dashboard/home screen interactions
 * Source: Common across all Maestro tests
 *
 * Uses case-insensitive selectors for React Native Web compatibility
 */
export class HomePage extends BasePage {
  // Locators - use regex for case-insensitivity
  readonly welcomeText: Locator;
  readonly importRecipeButton: Locator;
  readonly recipesTab: Locator;
  readonly mealPlanTab: Locator;
  readonly profileTab: Locator;

  constructor(page: Page) {
    super(page);
    // Use case-insensitive matchers for React Native Web
    this.welcomeText = page.getByText(/hello,?\s*chef/i);
    this.importRecipeButton = page.getByText(/import\s*recipe/i);
    this.recipesTab = page.getByText(/^recipes$/i);
    this.mealPlanTab = page.getByText(/meal\s*plan/i);
    this.profileTab = page.getByText(/^profile$/i);
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
    await this.waitForHydration();
  }

  /**
   * Verify home screen is displayed
   */
  async verifyHomeScreen(timeout = 15000) {
    // Wait for hydration first
    await this.waitForHydration();
    await expect(this.welcomeText).toBeVisible({ timeout });
  }

  /**
   * Check if user is logged in (home screen visible)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.waitForHydration();
      await this.welcomeText.waitFor({ state: 'visible', timeout: 8000 });
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
