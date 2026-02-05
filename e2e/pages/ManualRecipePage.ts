import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Manual Recipe Page Object
 * Handles manual recipe creation with ingredients and steps
 * Source: .maestro/recipes/create-recipe.yaml
 */
export class ManualRecipePage extends BasePage {
  // Locators
  readonly titleInput: Locator;
  readonly servingsInput: Locator;
  readonly prepTimeInput: Locator;
  readonly cookTimeInput: Locator;
  readonly addIngredientButton: Locator;
  readonly addStepButton: Locator;
  readonly saveRecipeButton: Locator;
  readonly ingredientInputs: Locator;
  readonly stepInputs: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.getByPlaceholder('Recipe Title');
    this.servingsInput = page.getByPlaceholder('Servings');
    this.prepTimeInput = page.getByPlaceholder('Prep Time');
    this.cookTimeInput = page.getByPlaceholder('Cook Time');
    this.addIngredientButton = page.getByText('Add Ingredient');
    this.addStepButton = page.getByText('Add Step');
    this.saveRecipeButton = page.getByText('Save Recipe');
    this.ingredientInputs = page.locator('[data-testid^="ingredient-input"]');
    this.stepInputs = page.locator('[data-testid^="step-input"]');
  }

  /**
   * Navigate to manual recipe page
   */
  async goto() {
    await super.goto('/manual-recipe');
  }

  /**
   * Verify manual recipe screen is displayed
   */
  async verifyManualRecipeScreen() {
    await expect(this.page.getByText('Recipe Title')).toBeVisible();
  }

  /**
   * Enter recipe title
   */
  async enterTitle(title: string) {
    await this.titleInput.click();
    await this.titleInput.fill(title);
  }

  /**
   * Enter servings count
   */
  async enterServings(servings: string) {
    await this.servingsInput.click();
    await this.servingsInput.clear();
    await this.servingsInput.fill(servings);
  }

  /**
   * Enter prep time
   */
  async enterPrepTime(time: string) {
    await this.prepTimeInput.click();
    await this.prepTimeInput.fill(time);
  }

  /**
   * Enter cook time
   */
  async enterCookTime(time: string) {
    await this.cookTimeInput.click();
    await this.cookTimeInput.fill(time);
  }

  /**
   * Add an ingredient
   */
  async addIngredient(ingredient: string) {
    await this.addIngredientButton.scrollIntoViewIfNeeded();
    await this.addIngredientButton.click();
    // Fill the last (newly added) ingredient input
    const inputs = this.page.locator('input[placeholder*="ingredient" i], input[placeholder*="Ingredient" i]');
    const lastInput = inputs.last();
    await lastInput.fill(ingredient);
  }

  /**
   * Add multiple ingredients
   */
  async addIngredients(ingredients: string[]) {
    for (const ingredient of ingredients) {
      await this.addIngredient(ingredient);
    }
  }

  /**
   * Add a step
   */
  async addStep(step: string) {
    await this.addStepButton.scrollIntoViewIfNeeded();
    await this.addStepButton.click();
    // Fill the last (newly added) step input
    const inputs = this.page.locator('textarea[placeholder*="step" i], input[placeholder*="step" i]');
    const lastInput = inputs.last();
    await lastInput.fill(step);
  }

  /**
   * Add multiple steps
   */
  async addSteps(steps: string[]) {
    for (const step of steps) {
      await this.addStep(step);
    }
  }

  /**
   * Click save recipe button
   */
  async clickSaveRecipe() {
    await this.saveRecipeButton.scrollIntoViewIfNeeded();
    await this.saveRecipeButton.click();
  }

  /**
   * Fill in basic recipe details
   */
  async fillBasicDetails(title: string, servings: string, prepTime: string, cookTime: string) {
    await this.enterTitle(title);
    await this.enterServings(servings);
    await this.enterPrepTime(prepTime);
    await this.enterCookTime(cookTime);
  }

  /**
   * Create complete recipe (full flow)
   */
  async createRecipe(
    title: string,
    servings: string,
    prepTime: string,
    cookTime: string,
    ingredients: string[],
    steps: string[]
  ) {
    await this.fillBasicDetails(title, servings, prepTime, cookTime);
    await this.addIngredients(ingredients);
    await this.addSteps(steps);
    await this.clickSaveRecipe();
  }

  /**
   * Verify recipe was created successfully
   */
  async verifyRecipeCreated(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }
}
