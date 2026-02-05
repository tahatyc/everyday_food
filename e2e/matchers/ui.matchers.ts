import { expect, Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../fixtures/test-data.fixture';

/**
 * UI state matchers for common patterns across the app
 */

/**
 * Assert page is in loading state
 */
export async function assertLoading(
  page: Page,
  options?: { timeout?: number }
) {
  // Look for common loading indicators
  const loadingIndicators = [
    page.getByTestId('loading'),
    page.getByTestId('spinner'),
    page.getByText(/loading/i),
    page.locator('[class*="loading"]'),
    page.locator('[class*="spinner"]'),
  ];

  // At least one loading indicator should be visible
  let found = false;
  for (const indicator of loadingIndicators) {
    try {
      await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 1000 });
      found = true;
      break;
    } catch {
      continue;
    }
  }

  return found;
}

/**
 * Assert loading has completed
 */
export async function assertLoadingComplete(
  page: Page,
  options?: { timeout?: number }
) {
  // Wait for loading indicators to disappear
  await page.waitForLoadState('networkidle', { timeout: options?.timeout ?? TIMEOUTS.long });
}

/**
 * Assert empty state is visible
 */
export async function assertEmptyState(
  page: Page,
  options?: { message?: string; timeout?: number }
) {
  if (options?.message) {
    await expect(page.getByText(options.message)).toBeVisible({ timeout: options?.timeout });
  } else {
    // Look for common empty state patterns
    const emptyIndicators = [
      page.getByText(/no .* found/i),
      page.getByText(/empty/i),
      page.getByText(/nothing here/i),
      page.getByTestId('empty-state'),
    ];

    for (const indicator of emptyIndicators) {
      try {
        await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 2000 });
        return;
      } catch {
        continue;
      }
    }
  }
}

/**
 * Assert error state is visible
 */
export async function assertError(
  page: Page,
  errorMessage?: string,
  options?: { timeout?: number }
) {
  if (errorMessage) {
    await expect(page.getByText(errorMessage)).toBeVisible(options);
  } else {
    const errorIndicators = [
      page.getByRole('alert'),
      page.getByText(/error/i),
      page.getByText(/failed/i),
      page.getByTestId('error'),
    ];

    for (const indicator of errorIndicators) {
      try {
        await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 2000 });
        return;
      } catch {
        continue;
      }
    }
  }
}

/**
 * Assert success message is visible
 */
export async function assertSuccess(
  page: Page,
  message?: string,
  options?: { timeout?: number }
) {
  if (message) {
    await expect(page.getByText(message)).toBeVisible(options);
  } else {
    const successIndicators = [
      page.getByText(/success/i),
      page.getByText(/saved/i),
      page.getByText(/created/i),
      page.getByTestId('success'),
    ];

    for (const indicator of successIndicators) {
      try {
        await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 2000 });
        return;
      } catch {
        continue;
      }
    }
  }
}

/**
 * Assert modal is open
 */
export async function assertModalOpen(
  page: Page,
  title?: string,
  options?: { timeout?: number }
) {
  if (title) {
    await expect(page.getByText(title)).toBeVisible(options);
  }
  // Check for modal backdrop or container
  const modalIndicators = [
    page.locator('[role="dialog"]'),
    page.locator('[class*="modal"]'),
    page.getByTestId('modal'),
  ];

  for (const indicator of modalIndicators) {
    try {
      await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 2000 });
      return;
    } catch {
      continue;
    }
  }
}

/**
 * Assert modal is closed
 */
export async function assertModalClosed(
  page: Page,
  options?: { timeout?: number }
) {
  const modalIndicators = [
    page.locator('[role="dialog"]'),
    page.locator('[class*="modal"]').first(),
  ];

  for (const indicator of modalIndicators) {
    try {
      await expect(indicator).not.toBeVisible({ timeout: options?.timeout ?? 2000 });
    } catch {
      // Modal might not exist at all, which is fine
    }
  }
}

/**
 * Assert tab is active
 */
export async function assertTabActive(
  page: Page,
  tabName: string,
  options?: { timeout?: number }
) {
  const tab = page.getByRole('tab', { name: tabName });
  await expect(tab).toHaveAttribute('aria-selected', 'true', options);
}

/**
 * Assert navigation to specific screen
 */
export async function assertOnScreen(
  page: Page,
  screenIdentifier: string | RegExp,
  options?: { timeout?: number }
) {
  await expect(page.getByText(screenIdentifier)).toBeVisible(options);
}

/**
 * Assert home screen loaded
 */
export async function assertHomeScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('HELLO, CHEF!')).toBeVisible({ timeout: options?.timeout ?? TIMEOUTS.medium });
}

/**
 * Assert recipes screen loaded
 */
export async function assertRecipesScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('Recipes')).toBeVisible(options);
  await expect(page.getByPlaceholder('Search recipes...')).toBeVisible(options);
}

/**
 * Assert meal plan screen loaded
 */
export async function assertMealPlanScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('WEEKLY PLANNER')).toBeVisible(options);
}

/**
 * Assert grocery list screen loaded
 */
export async function assertGroceryListScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText('SMART GROCERY LIST')).toBeVisible(options);
}

/**
 * Assert profile screen loaded
 */
export async function assertProfileScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText(/profile|chef/i)).toBeVisible(options);
}

/**
 * Assert friends screen loaded
 */
export async function assertFriendsScreen(
  page: Page,
  options?: { timeout?: number }
) {
  await expect(page.getByText(/friends/i)).toBeVisible(options);
}

/**
 * Meal plan specific matchers
 */
export const mealPlanMatchers = {
  /**
   * Assert meal slots are visible
   */
  async assertMealSlotsVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('BREAKFAST')).toBeVisible(options);
    await expect(page.getByText('LUNCH')).toBeVisible(options);
    await expect(page.getByText('DINNER')).toBeVisible(options);
  },

  /**
   * Assert add meal button visible
   */
  async assertAddMealVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Add a meal')).toBeVisible(options);
  },

  /**
   * Assert select recipe screen
   */
  async assertSelectRecipeScreen(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('SELECT')).toBeVisible(options);
  },

  /**
   * Assert generate plan option visible
   */
  async assertGeneratePlanVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText(/generate|ai|plan/i).first()).toBeVisible(options);
  },
};

/**
 * Grocery list specific matchers
 */
export const groceryListMatchers = {
  /**
   * Assert view toggles visible
   */
  async assertViewTogglesVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('AISLE')).toBeVisible(options);
    await expect(page.getByText('RECIPE')).toBeVisible(options);
  },

  /**
   * Assert checkout button visible
   */
  async assertCheckoutButtonVisible(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('CHECKOUT / ORDER LIST')).toBeVisible(options);
  },

  /**
   * Assert grocery item visible
   */
  async assertItemVisible(page: Page, itemName: string, options?: { timeout?: number }) {
    await expect(page.getByText(itemName)).toBeVisible(options);
  },

  /**
   * Assert item is checked
   */
  async assertItemChecked(page: Page, itemName: string, options?: { timeout?: number }) {
    const item = page.getByText(itemName);
    const checkbox = item.locator('..').locator('[type="checkbox"], [role="checkbox"]');
    await expect(checkbox).toBeChecked(options);
  },
};

/**
 * Auth screen matchers
 */
export const authMatchers = {
  /**
   * Assert login screen elements
   */
  async assertLoginScreen(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Everyday Food')).toBeVisible(options);
    await expect(page.getByText('Welcome Back')).toBeVisible(options);
    await expect(page.getByText('Sign In')).toBeVisible(options);
  },

  /**
   * Assert register screen elements
   */
  async assertRegisterScreen(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText('Create Account')).toBeVisible(options);
  },

  /**
   * Assert auth error
   */
  async assertAuthError(page: Page, errorMessage?: string, options?: { timeout?: number }) {
    if (errorMessage) {
      await expect(page.getByText(errorMessage)).toBeVisible(options);
    } else {
      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible(options);
    }
  },
};

/**
 * Cook mode specific matchers
 */
export const cookModeMatchers = {
  /**
   * Assert cook mode screen
   */
  async assertCookModeScreen(page: Page, options?: { timeout?: number }) {
    await expect(page.getByText(/step|cooking/i)).toBeVisible(options);
  },

  /**
   * Assert step navigation visible
   */
  async assertStepNavigationVisible(page: Page, options?: { timeout?: number }) {
    // Navigation arrows or step indicators
    const navIndicators = [
      page.getByRole('button', { name: /next|previous/i }),
      page.locator('[data-testid*="step"]'),
    ];

    for (const indicator of navIndicators) {
      try {
        await expect(indicator.first()).toBeVisible({ timeout: options?.timeout ?? 2000 });
        return;
      } catch {
        continue;
      }
    }
  },

  /**
   * Assert current step number
   */
  async assertStepNumber(page: Page, stepNum: number, options?: { timeout?: number }) {
    await expect(page.getByText(new RegExp(`step ${stepNum}|${stepNum}/`, 'i'))).toBeVisible(options);
  },
};
