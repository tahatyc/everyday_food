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
  readonly nextButton: Locator;
  readonly ingredientInputs: Locator;
  readonly stepInputs: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.getByPlaceholder("e.g., Grandma's Apple Pie");
    this.servingsInput = page.getByPlaceholder('4');
    this.prepTimeInput = page.getByPlaceholder('15');
    this.cookTimeInput = page.getByPlaceholder('30');
    this.addIngredientButton = page.getByText('ADD INGREDIENT');
    this.addStepButton = page.getByText('ADD STEP');
    this.saveRecipeButton = page.getByText('SAVE RECIPE');
    this.nextButton = page.getByText('NEXT');
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
    await expect(this.page.getByText('RECIPE TITLE', { exact: false })).toBeVisible();
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
   * Click Next to advance to the next wizard step
   */
  async clickNext() {
    await this.nextButton.scrollIntoViewIfNeeded();
    await this.nextButton.click();
    // Wait for animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to Ingredients step (step 2) from Basic Info (step 1)
   */
  async goToIngredientsStep() {
    // Check if we're on step 1 (Basic Info)
    const titleVisible = await this.titleInput.isVisible().catch(() => false);
    if (titleVisible) {
      await this.clickNext();
    }
    // Wait for ADD INGREDIENT button to be visible
    await expect(this.addIngredientButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate to Steps step (step 3) from current step
   */
  async goToStepsStep() {
    // Ensure we're on step 3
    const addStepVisible = await this.addStepButton.isVisible().catch(() => false);
    if (!addStepVisible) {
      // If on step 1, go to step 2 first
      const titleVisible = await this.titleInput.isVisible().catch(() => false);
      if (titleVisible) {
        await this.clickNext();
      }
      // Then go to step 3
      await this.clickNext();
    }
    await expect(this.addStepButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate to Extras step (step 4)
   */
  async goToExtrasStep() {
    // Click next until we reach step 4
    for (let i = 0; i < 3; i++) {
      const saveVisible = await this.saveRecipeButton.isVisible().catch(() => false);
      if (saveVisible) break;
      const nextVisible = await this.nextButton.isVisible().catch(() => false);
      if (nextVisible) {
        await this.clickNext();
      }
    }
    await expect(this.saveRecipeButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Add an ingredient (navigates to step 2 if needed)
   */
  async addIngredient(ingredient: string) {
    // Navigate to ingredients step if not already there
    const addIngredientVisible = await this.addIngredientButton.isVisible().catch(() => false);
    if (!addIngredientVisible) {
      await this.goToIngredientsStep();
    }

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
   * Add a step (navigates to step 3 if needed)
   */
  async addStep(step: string) {
    // Navigate to steps step if not already there
    const addStepVisible = await this.addStepButton.isVisible().catch(() => false);
    if (!addStepVisible) {
      await this.goToStepsStep();
    }

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
   * Click save recipe button (navigates to step 4 if needed)
   */
  async clickSaveRecipe() {
    // Navigate to extras step if not already there
    const saveVisible = await this.saveRecipeButton.isVisible().catch(() => false);
    if (!saveVisible) {
      await this.goToExtrasStep();
    }

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
    // Wait for navigation to recipe detail page
    await this.page.waitForURL(/\/recipe\//, { timeout: 30000 });

    // Wait for loading state to disappear
    await expect(this.page.getByText('Loading recipe...')).toBeHidden({ timeout: 30000 });

    // The recipe title is rendered with .toUpperCase() in the app code
    // Use exact: true to match only the element with actual uppercase text in DOM
    // (avoiding CSS text-transform elements that show uppercase visually but have lowercase DOM text)
    const titleLocator = this.page.getByText(title.toUpperCase(), { exact: true });
    await expect(titleLocator).toBeVisible({ timeout: 10000 });
  }
}
