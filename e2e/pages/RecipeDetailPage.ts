import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Recipe Detail Page Object
 * Handles viewing recipe details, ingredients, steps
 * Source: .maestro/recipes/view-recipe.yaml
 */
export class RecipeDetailPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly ingredientsSection: Locator;
  readonly stepsSection: Locator;
  readonly startCookingButton: Locator;
  readonly shareButton: Locator;
  readonly favoriteButton: Locator;
  readonly backButton: Locator;
  readonly servingsText: Locator;
  readonly prepTimeText: Locator;
  readonly cookTimeText: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('RECIPE');
    this.ingredientsSection = page.getByText('INGREDIENTS');
    this.stepsSection = page.getByText('STEPS');
    this.startCookingButton = page.getByText('START COOKING');
    this.shareButton = page.getByTestId('icon-share-outline');
    this.favoriteButton = page.getByTestId('icon-heart-outline');
    this.backButton = page.getByTestId('icon-arrow-back');
    this.servingsText = page.getByText(/servings?/i);
    this.prepTimeText = page.getByText(/prep/i);
    this.cookTimeText = page.getByText(/cook/i);
  }

  /**
   * Navigate to specific recipe detail page
   */
  async goto(recipeId: string) {
    await super.goto(`/recipe/${recipeId}`);
  }

  /**
   * Verify recipe detail screen is displayed
   */
  async verifyRecipeDetailScreen(timeout = 5000) {
    await expect(this.pageTitle).toBeVisible({ timeout });
  }

  /**
   * Verify ingredients section is visible
   */
  async verifyIngredientsVisible() {
    await expect(this.ingredientsSection).toBeVisible();
  }

  /**
   * Verify steps section is visible
   */
  async verifyStepsVisible() {
    await expect(this.stepsSection).toBeVisible();
  }

  /**
   * Verify start cooking button is visible
   */
  async verifyStartCookingVisible() {
    await expect(this.startCookingButton).toBeVisible();
  }

  /**
   * Click start cooking button to enter cook mode
   */
  async clickStartCooking() {
    await this.startCookingButton.scrollIntoViewIfNeeded();
    await this.startCookingButton.click();
  }

  /**
   * Click share button to open share modal
   */
  async clickShare() {
    await this.shareButton.click();
  }

  /**
   * Click favorite button to toggle favorite status
   */
  async clickFavorite() {
    await this.favoriteButton.click();
  }

  /**
   * Click back button to return to previous screen
   */
  async clickBack() {
    await this.backButton.click();
  }

  /**
   * Scroll to start cooking button
   */
  async scrollToStartCooking() {
    await this.startCookingButton.scrollIntoViewIfNeeded();
  }

  /**
   * Get recipe title text
   */
  async getRecipeTitle(): Promise<string | null> {
    const titleElement = this.page.locator('h1, [data-testid="recipe-title"]').first();
    return await titleElement.textContent();
  }

  /**
   * Verify all main sections are displayed
   */
  async verifyAllSections() {
    await this.verifyRecipeDetailScreen();
    await this.verifyIngredientsVisible();
    await this.verifyStartCookingVisible();
  }
}
