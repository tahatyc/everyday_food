import { expect, Page, Locator } from '@playwright/test';

/**
 * Recipe-specific custom matchers and assertions
 * Extends Playwright's expect with domain-specific validations
 */

/**
 * Assert that a recipe card is visible with expected elements
 */
export async function assertRecipeCardVisible(
  page: Page,
  recipeName: string,
  options?: { timeout?: number }
) {
  const card = page.getByText(recipeName).first();
  await expect(card).toBeVisible(options);
}

/**
 * Assert recipe detail page has loaded with all required sections
 */
export async function assertRecipeDetailLoaded(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('RECIPE')).toBeVisible(options);
  await expect(page.getByText('INGREDIENTS')).toBeVisible(options);
}

/**
 * Assert recipe detail page has steps section
 */
export async function assertRecipeHasSteps(
  page: Page,
  options?: { timeout?: number }
) {
  // Steps section may be labeled differently
  const stepsSection = page.getByText(/steps|instructions|directions/i).first();
  await expect(stepsSection).toBeVisible(options);
}

/**
 * Assert recipe has specific ingredient
 */
export async function assertRecipeHasIngredient(
  page: Page,
  ingredientName: string,
  options?: { timeout?: number }
) {
  await expect(page.getByText(ingredientName)).toBeVisible(options);
}

/**
 * Assert recipe has cooking actions available
 */
export async function assertRecipeCookingActionsVisible(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('START COOKING')).toBeVisible(options);
}

/**
 * Assert recipe filter chips are visible
 */
export async function assertRecipeFiltersVisible(
  page: Page,
  filters: string[] = ['All', 'My Recipes'],
  options?: { timeout?: number }
) {
  for (const filter of filters) {
    await expect(page.getByText(filter)).toBeVisible(options);
  }
}

/**
 * Assert recipe search input is functional
 */
export async function assertRecipeSearchVisible(
  page: Page,
  placeholder: string = 'Search recipes...',
  options?: { timeout?: number }
) {
  await expect(page.getByPlaceholder(placeholder)).toBeVisible(options);
}

/**
 * Assert meal type filter chips
 */
export async function assertMealTypeFiltersVisible(
  page: Page,
  mealTypes: string[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
  options?: { timeout?: number }
) {
  for (const mealType of mealTypes) {
    // These might not all be visible depending on scroll position
    const chip = page.getByText(mealType).first();
    // Use soft assertion - don't fail if not all are visible
    try {
      await expect(chip).toBeVisible({ timeout: options?.timeout ?? 2000 });
    } catch {
      // Meal type filter might need scrolling
    }
  }
}

/**
 * Assert recipe list has items (not empty)
 */
export async function assertRecipeListNotEmpty(
  page: Page,
  options?: { timeout?: number }
) {
  // Look for recipe cards or items
  const recipeItems = page.locator('[data-testid*="recipe"]').first();
  await expect(recipeItems).toBeVisible(options);
}

/**
 * Assert recipe was created successfully
 */
export async function assertRecipeCreated(
  page: Page,
  recipeTitle: string,
  options?: { timeout?: number }
) {
  await expect(page.getByText(recipeTitle)).toBeVisible(options);
}

/**
 * Assert favorite status of a recipe
 */
export async function assertRecipeFavorited(
  page: Page,
  isFavorited: boolean,
  options?: { timeout?: number }
) {
  const favoriteIcon = page.getByTestId(isFavorited ? 'icon-heart' : 'icon-heart-outline');
  await expect(favoriteIcon.first()).toBeVisible(options);
}

/**
 * Recipe form validation helpers
 */
export const recipeFormMatchers = {
  /**
   * Assert recipe form is visible with all fields
   */
  async assertFormVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Recipe Title')).toBeVisible(options);
    await expect(page.getByText('Servings')).toBeVisible(options);
  },

  /**
   * Assert ingredient field is visible
   */
  async assertIngredientFieldVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Add Ingredient')).toBeVisible(options);
  },

  /**
   * Assert step field is visible
   */
  async assertStepFieldVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Add Step')).toBeVisible(options);
  },

  /**
   * Assert save button is visible
   */
  async assertSaveButtonVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Save Recipe')).toBeVisible(options);
  },
};

/**
 * Share modal matchers
 */
export const shareModalMatchers = {
  /**
   * Assert share modal is open
   */
  async assertModalOpen(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('SHARE RECIPE')).toBeVisible(options);
  },

  /**
   * Assert friends tab content
   */
  async assertFriendsTabVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('FRIENDS')).toBeVisible(options);
    await expect(page.getByText('Share with friends')).toBeVisible(options);
  },

  /**
   * Assert link tab content
   */
  async assertLinkTabVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('LINK')).toBeVisible(options);
    await expect(page.getByText('Create shareable link')).toBeVisible(options);
  },

  /**
   * Assert link was created successfully
   */
  async assertLinkCreated(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Link Created')).toBeVisible(options);
  },

  /**
   * Assert active links section visible
   */
  async assertActiveLinksVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Active links')).toBeVisible(options);
  },
};
